package app.dailythings.widget;

import android.graphics.Bitmap;
import android.graphics.Color;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

/**
 * Pikselowa ikona habitu z tego samego sprite'a co w aplikacji
 * (utils/pixelIcons.ts): RLE z rolami '.' tło, 'o' kontur, 'f' wypełnienie,
 * 'h' światło, 's' cień. Kolory ról przychodzą od aplikacji.
 */
public final class PixelSprite {

    public static final int SIZE = 26;
    private static final Pattern RUN = Pattern.compile("([.ofhs])(\\d*)");

    private PixelSprite() {}

    /** Piksele ARGB (SIZE × SIZE) — czysta logika, bez Bitmapy. */
    public static int[] decode(String rle, int outline, int fill, int highlight, int shade) {
        int[] pixels = new int[SIZE * SIZE];
        int cell = 0;
        Matcher m = RUN.matcher(rle == null ? "" : rle);
        while (m.find() && cell < pixels.length) {
            int count = m.group(2).isEmpty() ? 1 : Integer.parseInt(m.group(2));
            int color;
            switch (m.group(1).charAt(0)) {
                case 'o':
                    color = outline;
                    break;
                case 'f':
                    color = fill;
                    break;
                case 'h':
                    color = highlight;
                    break;
                case 's':
                    color = shade;
                    break;
                default:
                    color = 0;
            }
            for (int i = 0; i < count && cell < pixels.length; i++) pixels[cell++] = color;
        }
        return pixels;
    }

    /** Bitmapa powiększona „najbliższym sąsiadem”, żeby piksele zostały ostre. */
    public static Bitmap bitmap(String rle, JSONObject colors, int scale) {
        int[] pixels = decode(
            rle,
            parse(colors, "o", 0xFF4B3528),
            parse(colors, "f", 0xFFF2994A),
            parse(colors, "h", 0xFFFFC98B),
            parse(colors, "s", 0xFFD0703A)
        );
        Bitmap small = Bitmap.createBitmap(pixels, SIZE, SIZE, Bitmap.Config.ARGB_8888);
        if (scale <= 1) return small;
        Bitmap big = Bitmap.createScaledBitmap(small, SIZE * scale, SIZE * scale, false);
        if (big != small) small.recycle();
        return big;
    }

    private static int parse(JSONObject colors, String key, int fallback) {
        if (colors == null) return fallback;
        try {
            return Color.parseColor(colors.optString(key));
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}
