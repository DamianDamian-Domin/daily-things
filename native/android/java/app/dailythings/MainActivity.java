package app.dailythings;

import android.os.Bundle;
import app.dailythings.widget.HabitsWidgetPlugin;
import com.getcapacitor.BridgeActivity;

// Kopiowane przez scripts/sync-android-native.mjs — zmieniaj tutaj, nie w android/
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Wtyczki z kodu aplikacji rejestrujemy przed startem mostu Capacitora
        registerPlugin(HabitsWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
