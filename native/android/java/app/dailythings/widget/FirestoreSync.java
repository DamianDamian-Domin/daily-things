package app.dailythings.widget;

import android.content.Context;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Wysyła odhaczenia z widżetu do Firestore przez REST API — bez otwierania
 * aplikacji. Zapis jest tym samym, co robi logHabit / removeLog w aplikacji:
 * arrayUnion / arrayRemove wpisu w users/{uid}/habbits/{YYYY-MM-DD}.
 * Obowiązują te same reguły bezpieczeństwa (token zalogowanego użytkownika).
 */
public final class FirestoreSync {

    private static final String TAG = "HabitsWidget";
    // Klucze w Firestore zostają ze starą pisownią (zob. services/userData.ts)
    private static final String DAYS_COLLECTION = "habbits";
    private static final String DAY_LOGS_FIELD = "habbits";
    private static final int TIMEOUT_MS = 10_000;

    // Token ID żyje godzinę — trzymamy go w pamięci procesu
    private static String idToken;
    private static String idTokenUid;
    private static long idTokenExpiresAt;

    private FirestoreSync() {}

    /**
     * Wysyła kolejne akcje z kolejki; przerywa na pierwszym błędzie (zostaną
     * na później). SEND_LOCK trzyma się przez całe wysyłanie — wtyczka bierze
     * go przed przejęciem kolejki, więc aplikacja nigdy nie dostanie akcji,
     * która właśnie leci do Firestore. LOCK (dane) tylko na chwilę, żeby
     * stuknięcia w widżet nie czekały na sieć.
     */
    public static void syncPending(Context context) {
        synchronized (WidgetStore.SEND_LOCK) {
            while (true) {
                JSONObject auth;
                JSONObject action;
                synchronized (WidgetStore.LOCK) {
                    auth = WidgetStore.auth(context);
                    JSONArray pending = WidgetStore.pending(context);
                    if (auth == null || pending.length() == 0) return;
                    action = pending.optJSONObject(0);
                }
                try {
                    if (action != null) send(context, auth, action);
                } catch (Exception e) {
                    Log.w(TAG, "Widget sync failed, will retry later", e);
                    return;
                }
                synchronized (WidgetStore.LOCK) {
                    JSONArray pending = WidgetStore.pending(context);
                    if (pending.length() > 0) pending.remove(0);
                    WidgetStore.setPending(context, pending);
                    if (action != null) {
                        JSONArray synced = WidgetStore.synced(context);
                        synced.put(action);
                        WidgetStore.setSynced(context, synced);
                    }
                }
            }
        }
    }

    private static void send(Context context, JSONObject auth, JSONObject action) throws IOException, JSONException {
        String token = idToken(context, auth);
        JSONObject state;
        synchronized (WidgetStore.LOCK) {
            state = WidgetStore.state(context);
        }
        JSONArray snapshot = state != null ? state.optJSONArray("snapshot") : null;
        JSONObject body = commitBody(auth.getString("projectId"), auth.getString("uid"), action, snapshot);
        String url =
            "https://firestore.googleapis.com/v1/projects/" +
            auth.getString("projectId") +
            "/databases/(default)/documents:commit";
        HttpURLConnection conn = open(url);
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        String response = post(conn, body.toString());
        if (response == null) {
            // 401: token nieaktualny — następna próba pobierze nowy
            if (conn.getResponseCode() == 401) idToken = null;
            throw new IOException("Firestore commit failed: HTTP " + conn.getResponseCode());
        }
    }

    // ------------------------------------------------------------------
    // Czysta logika (bez sieci) — testowana w native/android/test
    // ------------------------------------------------------------------

    /** Treść documents:commit dla jednej akcji widżetu. */
    public static JSONObject commitBody(String projectId, String uid, JSONObject action, JSONArray snapshot)
        throws JSONException {
        String date = action.getString("date");
        boolean isLog = "log".equals(action.getString("op"));

        JSONObject fields = new JSONObject();
        fields.put("date", toValue(date));
        JSONArray mask = new JSONArray().put("date");
        // Jak logHabit: odhaczenie zapisuje dzisiejszą migawkę celów
        if (isLog && snapshot != null) {
            fields.put("goalsSnapshot", toValue(snapshot));
            mask.put("goalsSnapshot");
        }

        JSONObject transform = new JSONObject();
        transform.put("fieldPath", DAY_LOGS_FIELD);
        transform.put(
            isLog ? "appendMissingElements" : "removeAllFromArray",
            new JSONObject().put("values", new JSONArray().put(toValue(action.getJSONObject("log"))))
        );

        JSONObject write = new JSONObject();
        write.put(
            "update",
            new JSONObject()
                .put(
                    "name",
                    "projects/" + projectId + "/databases/(default)/documents/users/" + uid + "/" +
                    DAYS_COLLECTION + "/" + date
                )
                .put("fields", fields)
        );
        write.put("updateMask", new JSONObject().put("fieldPaths", mask));
        write.put("updateTransforms", new JSONArray().put(transform));
        return new JSONObject().put("writes", new JSONArray().put(write));
    }

    /** JSON → wartość Firestore. Liczby całkowite jako integerValue (jak SDK JS). */
    public static JSONObject toValue(Object value) throws JSONException {
        JSONObject out = new JSONObject();
        if (value == null || value == JSONObject.NULL) {
            out.put("nullValue", JSONObject.NULL);
        } else if (value instanceof String) {
            out.put("stringValue", value);
        } else if (value instanceof Boolean) {
            out.put("booleanValue", value);
        } else if (value instanceof Integer || value instanceof Long) {
            out.put("integerValue", String.valueOf(((Number) value).longValue()));
        } else if (value instanceof Number) {
            double d = ((Number) value).doubleValue();
            if (d == Math.rint(d) && Math.abs(d) <= 9007199254740991d) {
                out.put("integerValue", String.valueOf((long) d));
            } else {
                out.put("doubleValue", d);
            }
        } else if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            JSONArray values = new JSONArray();
            for (int i = 0; i < array.length(); i++) values.put(toValue(array.get(i)));
            out.put("arrayValue", new JSONObject().put("values", values));
        } else if (value instanceof JSONObject) {
            JSONObject object = (JSONObject) value;
            JSONObject fields = new JSONObject();
            Iterator<String> keys = object.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                fields.put(key, toValue(object.get(key)));
            }
            out.put("mapValue", new JSONObject().put("fields", fields));
        } else {
            out.put("stringValue", value.toString());
        }
        return out;
    }

    // ------------------------------------------------------------------
    // Sieć
    // ------------------------------------------------------------------

    private static String idToken(Context context, JSONObject auth) throws IOException, JSONException {
        String uid = auth.getString("uid");
        if (idToken != null && uid.equals(idTokenUid) && System.currentTimeMillis() < idTokenExpiresAt) {
            return idToken;
        }
        String url = "https://securetoken.googleapis.com/v1/token?key=" + URLEncoder.encode(auth.getString("apiKey"), "UTF-8");
        HttpURLConnection conn = open(url);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        String form =
            "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(auth.getString("refreshToken"), "UTF-8");
        String response = post(conn, form);
        if (response == null) throw new IOException("Token refresh failed: HTTP " + conn.getResponseCode());
        JSONObject json = new JSONObject(response);
        if (!uid.equals(json.optString("user_id"))) throw new IOException("Token belongs to another user");
        idToken = json.getString("id_token");
        idTokenUid = uid;
        // Minuta zapasu przed wygaśnięciem
        idTokenExpiresAt = System.currentTimeMillis() + (Long.parseLong(json.optString("expires_in", "3600")) - 60) * 1000L;
        String refreshed = json.optString("refresh_token", null);
        if (refreshed != null && !refreshed.equals(auth.getString("refreshToken"))) {
            auth.put("refreshToken", refreshed);
            synchronized (WidgetStore.LOCK) {
                JSONObject current = WidgetStore.auth(context);
                // Aplikacja mogła w międzyczasie przekazać nowe dane (np. inne konto)
                if (current != null && uid.equals(current.optString("uid"))) WidgetStore.setAuth(context, auth);
            }
        }
        return idToken;
    }

    private static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        return conn;
    }

    /** Treść odpowiedzi przy 2xx, inaczej null. */
    private static String post(HttpURLConnection conn, String body) throws IOException {
        try (OutputStream out = conn.getOutputStream()) {
            out.write(body.getBytes(StandardCharsets.UTF_8));
        }
        int code = conn.getResponseCode();
        if (code < 200 || code >= 300) {
            InputStream err = conn.getErrorStream();
            if (err != null) Log.w(TAG, "HTTP " + code + ": " + read(err));
            return null;
        }
        return read(conn.getInputStream());
    }

    private static String read(InputStream in) throws IOException {
        try (InputStream stream = in) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int n;
            while ((n = stream.read(chunk)) != -1) buffer.write(chunk, 0, n);
            return buffer.toString("UTF-8");
        }
    }
}
