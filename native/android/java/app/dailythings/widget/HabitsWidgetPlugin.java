package app.dailythings.widget;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Most aplikacja ↔ widżet (strona JS: src/utils/habitsWidget.ts). */
@CapacitorPlugin(name = "HabitsWidget")
public class HabitsWidgetPlugin extends Plugin {

    /** Nowy stan od aplikacji (null = wylogowano). */
    @PluginMethod
    public void update(PluginCall call) {
        String rawState = call.getString("state");
        String rawAuth = call.getString("auth");
        try {
            synchronized (WidgetStore.LOCK) {
                if (rawState == null) {
                    WidgetStore.setState(getContext(), null);
                    WidgetStore.setAuth(getContext(), null);
                    WidgetStore.setPending(getContext(), new JSONArray());
                    WidgetStore.setSynced(getContext(), new JSONArray());
                } else {
                    JSONObject state = WidgetStore.mergeUnseen(
                        new JSONObject(rawState),
                        WidgetStore.synced(getContext()),
                        WidgetStore.pending(getContext())
                    );
                    WidgetStore.setState(getContext(), state);
                    WidgetStore.setAuth(getContext(), rawAuth == null ? null : new JSONObject(rawAuth));
                }
            }
        } catch (JSONException e) {
            call.reject("Invalid widget state", e);
            return;
        }
        HabitsWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    /** Odhaczenia z widżetu, o których aplikacja jeszcze nie wie (kolejka się czyści). */
    @PluginMethod
    public void takeActions(PluginCall call) {
        JSArray synced;
        JSArray pending;
        // Czekamy, aż skończy się trwające wysyłanie (zob. FirestoreSync.syncPending)
        synchronized (WidgetStore.SEND_LOCK) {
            synchronized (WidgetStore.LOCK) {
                try {
                    synced = new JSArray(WidgetStore.synced(getContext()).toString());
                    pending = new JSArray(WidgetStore.pending(getContext()).toString());
                } catch (JSONException e) {
                    call.reject("Invalid widget queue", e);
                    return;
                }
                WidgetStore.setSynced(getContext(), new JSONArray());
                WidgetStore.setPending(getContext(), new JSONArray());
            }
        }
        JSObject result = new JSObject();
        result.put("synced", synced);
        result.put("pending", pending);
        call.resolve(result);
    }
}
