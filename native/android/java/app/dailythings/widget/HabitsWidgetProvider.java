package app.dailythings.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;
import app.dailythings.R;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Widżet „Today” — dzisiejsze cele z ikonami. Stuknięcie w cel odhacza go
 * (albo cofa, gdy cel jest już zrobiony) bez otwierania aplikacji;
 * stuknięcie w nagłówek otwiera aplikację.
 */
public class HabitsWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "HabitsWidget";
    public static final String ACTION_TAP = "app.dailythings.widget.TAP";
    private static final String EXTRA_NAME = "name";
    // Wiersz celu + nagłówek (dp) — do policzenia, ile celów się zmieści
    private static final int ROW_DP = 46;
    private static final int HEADER_DP = 52;
    private static final int ICON_SCALE = 3;

    // Jeden wątek: zapisy idą po kolei, w kolejności stuknięć
    private static final ExecutorService SYNC = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
        // Okresowe odświeżenie to też okazja, by dosłać zaległe odhaczenia
        syncInBackground(context, null);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        render(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_TAP.equals(intent.getAction())) {
            onTap(context, intent.getStringExtra(EXTRA_NAME));
            return;
        }
        super.onReceive(context, intent);
    }

    private void onTap(Context context, String name) {
        if (name == null) return;
        WidgetStore.TapResult result;
        synchronized (WidgetStore.LOCK) {
            JSONObject state = WidgetStore.state(context);
            JSONArray pending = WidgetStore.pending(context);
            try {
                result = WidgetStore.applyTap(
                    state,
                    pending,
                    name,
                    WidgetStore.todayKey(),
                    System.currentTimeMillis(),
                    WidgetStore.newId()
                );
            } catch (JSONException e) {
                Log.w(TAG, "Tap failed", e);
                return;
            }
            if (result == WidgetStore.TapResult.LOGGED || result == WidgetStore.TapResult.UNLOGGED) {
                WidgetStore.setState(context, state);
                WidgetStore.setPending(context, pending);
            }
        }
        refreshAll(context);
        if (result == WidgetStore.TapResult.LOGGED || result == WidgetStore.TapResult.UNLOGGED) {
            syncInBackground(context, goAsync());
        }
    }

    private static void syncInBackground(Context context, PendingResult pendingResult) {
        Context app = context.getApplicationContext();
        SYNC.execute(() -> {
            try {
                FirestoreSync.syncPending(app);
            } finally {
                if (pendingResult != null) pendingResult.finish();
            }
        });
    }

    // ------------------------------------------------------------------
    // Rysowanie
    // ------------------------------------------------------------------

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, HabitsWidgetProvider.class));
        for (int id : ids) render(context, manager, id);
    }

    private static void render(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits);
        views.setOnClickPendingIntent(R.id.widget_header, openAppIntent(context));
        views.setOnClickPendingIntent(R.id.widget_message, openAppIntent(context));
        views.setOnClickPendingIntent(R.id.widget_more, openAppIntent(context));
        views.removeAllViews(R.id.widget_goals);

        JSONObject state;
        synchronized (WidgetStore.LOCK) {
            state = WidgetStore.state(context);
        }
        try {
            if (state != null) WidgetStore.rollOver(state, WidgetStore.todayKey());
            JSONArray goals = state != null ? state.optJSONArray("goals") : null;
            if (state == null) {
                showMessage(views, context.getString(R.string.widget_signed_out), "");
            } else if (goals == null || goals.length() == 0) {
                showMessage(views, context.getString(R.string.widget_no_goals), "");
            } else {
                renderGoals(context, views, state, goals, maxRows(manager, widgetId));
            }
        } catch (JSONException e) {
            Log.w(TAG, "Render failed", e);
            showMessage(views, context.getString(R.string.widget_signed_out), "");
        }
        manager.updateAppWidget(widgetId, views);
    }

    private static void renderGoals(Context context, RemoteViews views, JSONObject state, JSONArray goals, int maxRows)
        throws JSONException {
        views.setViewVisibility(R.id.widget_message, View.GONE);
        views.setViewVisibility(R.id.widget_goals, View.VISIBLE);
        JSONObject ghost = state.optJSONObject("ghost");
        int done = 0;
        int total = 0;
        int shown = Math.min(goals.length(), maxRows);
        for (int i = 0; i < goals.length(); i++) {
            JSONObject goal = goals.getJSONObject(i);
            int target = Math.max(1, goal.optInt("target", 1));
            JSONArray logs = goal.optJSONArray("logs");
            int count = Math.min(logs == null ? 0 : logs.length(), target);
            done += count;
            total += target;
            if (i >= shown) continue;

            boolean complete = count >= target;
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_goal_row);
            row.setImageViewBitmap(
                R.id.row_icon,
                PixelSprite.bitmap(goal.optString("sprite"), complete ? goal.optJSONObject("colors") : ghost, ICON_SCALE)
            );
            row.setTextViewText(R.id.row_label, goal.optString("label", goal.optString("name")));
            row.setTextViewText(R.id.row_count, target > 1 ? count + "/" + target : complete ? "✓" : "");
            row.setInt(
                R.id.row_root,
                "setBackgroundResource",
                complete ? R.drawable.widget_row_done_bg : R.drawable.widget_row_bg
            );
            row.setOnClickPendingIntent(R.id.row_root, tapIntent(context, goal.optString("name")));
            row.setContentDescription(
                R.id.row_root,
                context.getString(complete ? R.string.widget_row_done : R.string.widget_row_todo, goal.optString("label"))
            );
            views.addView(R.id.widget_goals, row);
        }
        views.setTextViewText(R.id.widget_progress, done + "/" + total);
        int hidden = goals.length() - shown;
        if (hidden > 0) {
            views.setViewVisibility(R.id.widget_more, View.VISIBLE);
            views.setTextViewText(R.id.widget_more, context.getString(R.string.widget_more, hidden));
        } else {
            views.setViewVisibility(R.id.widget_more, View.GONE);
        }
    }

    private static void showMessage(RemoteViews views, String message, String progress) {
        views.setViewVisibility(R.id.widget_goals, View.GONE);
        views.setViewVisibility(R.id.widget_more, View.GONE);
        views.setViewVisibility(R.id.widget_message, View.VISIBLE);
        views.setTextViewText(R.id.widget_message, message);
        views.setTextViewText(R.id.widget_progress, progress);
    }

    private static int maxRows(AppWidgetManager manager, int widgetId) {
        Bundle options = manager.getAppWidgetOptions(widgetId);
        // W pionie launcher podaje wysokość jako MAX_HEIGHT
        int height = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0) : 0;
        if (height <= 0) return 4;
        return Math.max(1, (height - HEADER_DP) / ROW_DP);
    }

    // ------------------------------------------------------------------
    // Intencje
    // ------------------------------------------------------------------

    private static PendingIntent tapIntent(Context context, String name) {
        Intent intent = new Intent(context, HabitsWidgetProvider.class);
        intent.setAction(ACTION_TAP);
        intent.putExtra(EXTRA_NAME, name);
        // Unikalny adres — inaczej Android połączyłby intencje różnych celów
        intent.setData(Uri.parse("dailythings://widget/goal/" + Uri.encode(name)));
        return PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch == null) launch = new Intent();
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return PendingIntent.getActivity(context, 1, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
