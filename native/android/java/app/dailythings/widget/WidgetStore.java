package app.dailythings.widget;

import android.content.Context;
import android.content.SharedPreferences;
import java.security.SecureRandom;
import java.util.Calendar;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Stan widżetu w SharedPreferences (prywatne dane aplikacji):
 *  - state   – cele i dzisiejsze wpisy przekazane przez aplikację (utils/habitsWidget.ts)
 *  - auth    – dane do zapisu w Firestore (klucz API, projekt, uid, token odświeżania)
 *  - pending – odhaczenia z widżetu, których jeszcze nie wysłano
 *  - synced  – odhaczenia wysłane, o których aplikacja jeszcze nie wie
 * Każdy dostęp idzie przez LOCK, bo piszą tu: widżet, wątek synchronizacji i wtyczka.
 * SEND_LOCK — zob. FirestoreSync.syncPending.
 */
public final class WidgetStore {

    public static final Object LOCK = new Object();
    public static final Object SEND_LOCK = new Object();

    private static final String PREFS = "daily_things_widget";
    private static final String KEY_STATE = "state";
    private static final String KEY_AUTH = "auth";
    private static final String KEY_PENDING = "pending";
    private static final String KEY_SYNCED = "synced";
    // Ten sam alfabet co nanoid w aplikacji
    private static final String ID_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
    private static final SecureRandom RANDOM = new SecureRandom();

    public enum TapResult { LOGGED, UNLOGGED, NO_STATE, UNKNOWN_GOAL }

    private WidgetStore() {}

    // ------------------------------------------------------------------
    // Czysta logika (bez Androida) — testowana w native/android/test
    // ------------------------------------------------------------------

    /** Klucz dnia YYYY-MM-DD w lokalnej strefie (jak toDateKey w utils/date.ts). */
    public static String dateKey(Calendar c) {
        return String.format(
            Locale.ROOT,
            "%04d-%02d-%02d",
            c.get(Calendar.YEAR),
            c.get(Calendar.MONTH) + 1,
            c.get(Calendar.DAY_OF_MONTH)
        );
    }

    public static String todayKey() {
        return dateKey(Calendar.getInstance());
    }

    public static String newId() {
        StringBuilder sb = new StringBuilder(21);
        for (int i = 0; i < 21; i++) sb.append(ID_ALPHABET.charAt(RANDOM.nextInt(ID_ALPHABET.length())));
        return sb.toString();
    }

    /** Nowy dzień: cele zostają, wczorajsze wpisy znikają. */
    public static void rollOver(JSONObject state, String today) throws JSONException {
        if (today.equals(state.optString("date"))) return;
        state.put("date", today);
        JSONArray goals = state.optJSONArray("goals");
        if (goals == null) return;
        for (int i = 0; i < goals.length(); i++) goals.getJSONObject(i).put("logs", new JSONArray());
    }

    public static JSONObject findGoal(JSONObject state, String name) throws JSONException {
        JSONArray goals = state.optJSONArray("goals");
        if (goals == null) return null;
        for (int i = 0; i < goals.length(); i++) {
            JSONObject goal = goals.getJSONObject(i);
            if (name.equals(goal.optString("name"))) return goal;
        }
        return null;
    }

    /**
     * Stuknięcie w cel — ta sama zasada co tapGoal w aplikacji: dopóki cel
     * nie jest zrobiony → +1, potem → cofnij ostatnie odhaczenie.
     * Zmienia `state` i dopisuje akcję do `pending`.
     */
    public static TapResult applyTap(
        JSONObject state,
        JSONArray pending,
        String name,
        String today,
        long now,
        String id
    ) throws JSONException {
        if (state == null) return TapResult.NO_STATE;
        rollOver(state, today);
        JSONObject goal = findGoal(state, name);
        if (goal == null) return TapResult.UNKNOWN_GOAL;
        JSONArray logs = goal.optJSONArray("logs");
        if (logs == null) {
            logs = new JSONArray();
            goal.put("logs", logs);
        }
        JSONObject action = new JSONObject();
        action.put("date", today);
        if (logs.length() < goal.optInt("target", 1)) {
            JSONObject log = new JSONObject();
            JSONObject extra = goal.optJSONObject("extra");
            if (extra != null) {
                JSONArray keys = extra.names();
                for (int i = 0; keys != null && i < keys.length(); i++) {
                    String key = keys.getString(i);
                    log.put(key, extra.get(key));
                }
            }
            log.put("id", id);
            log.put("name", name);
            log.put("at", now);
            logs.put(log);
            action.put("op", "log");
            action.put("log", log);
            pending.put(action);
            return TapResult.LOGGED;
        }
        JSONObject removed = (JSONObject) logs.remove(logs.length() - 1);
        action.put("op", "unlog");
        action.put("log", removed);
        pending.put(action);
        return TapResult.UNLOGGED;
    }

    // ------------------------------------------------------------------
    // SharedPreferences
    // ------------------------------------------------------------------

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static JSONObject readObject(Context context, String key) {
        String raw = prefs(context).getString(key, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    public static JSONArray readArray(Context context, String key) {
        String raw = prefs(context).getString(key, null);
        if (raw == null) return new JSONArray();
        try {
            return new JSONArray(raw);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    private static void write(Context context, String key, Object value) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (value == null) editor.remove(key);
        else editor.putString(key, value.toString());
        editor.commit();
    }

    public static JSONObject state(Context context) {
        return readObject(context, KEY_STATE);
    }

    public static void setState(Context context, JSONObject state) {
        write(context, KEY_STATE, state);
    }

    public static JSONObject auth(Context context) {
        return readObject(context, KEY_AUTH);
    }

    public static void setAuth(Context context, JSONObject auth) {
        write(context, KEY_AUTH, auth);
    }

    public static JSONArray pending(Context context) {
        return readArray(context, KEY_PENDING);
    }

    public static void setPending(Context context, JSONArray pending) {
        write(context, KEY_PENDING, pending.length() == 0 ? null : pending);
    }

    public static JSONArray synced(Context context) {
        return readArray(context, KEY_SYNCED);
    }

    public static void setSynced(Context context, JSONArray synced) {
        write(context, KEY_SYNCED, synced.length() == 0 ? null : synced);
    }

    /**
     * Stan od aplikacji. Odhaczenia z widżetu, o których aplikacja jeszcze nie
     * wie (pending + synced z dzisiaj), nakładamy na nowy stan, żeby widżet nie
     * „zapominał” ich do czasu, aż aplikacja je przejmie.
     */
    public static JSONObject mergeUnseen(JSONObject state, JSONArray synced, JSONArray pending)
        throws JSONException {
        String date = state.optString("date");
        JSONArray[] lists = { synced, pending };
        for (JSONArray list : lists) {
            for (int i = 0; i < list.length(); i++) {
                JSONObject action = list.getJSONObject(i);
                if (!date.equals(action.optString("date"))) continue;
                JSONObject log = action.getJSONObject("log");
                JSONObject goal = findGoal(state, log.optString("name"));
                if (goal == null) continue;
                JSONArray logs = goal.optJSONArray("logs");
                if (logs == null) {
                    logs = new JSONArray();
                    goal.put("logs", logs);
                }
                int idx = indexOfId(logs, log.optString("id"));
                if ("log".equals(action.optString("op"))) {
                    if (idx == -1) logs.put(log);
                } else if (idx != -1) {
                    logs.remove(idx);
                }
            }
        }
        return state;
    }

    private static int indexOfId(JSONArray logs, String id) throws JSONException {
        for (int i = 0; i < logs.length(); i++) {
            if (id.equals(logs.getJSONObject(i).optString("id"))) return i;
        }
        return -1;
    }
}
