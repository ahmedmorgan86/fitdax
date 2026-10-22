package com.ahmedmorgan.fitdax;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import java.util.List;

/** Uses the live HTTPS application; no bundled stale HTML and no embedded WebView. */
public final class MainActivity extends Activity {
    private static final Uri HOME = Uri.parse("https://fitdax.vercel.app/fitverse/index.html");
    private TwaLauncher launcher;
    private TextView status;
    private Typeface font;
    private boolean arabic;
    private boolean opening;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        arabic = getResources().getConfiguration().getLocales().get(0).getLanguage().equals("ar");
        try { font = Typeface.createFromAsset(getAssets(), "Cairo.ttf"); } catch (RuntimeException ignored) { font = Typeface.DEFAULT; }
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(32, 48, 32, 48);
        layout.setBackgroundColor(Color.rgb(7,12,12));
        layout.setLayoutDirection(arabic ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_LTR);
        TextView title = new TextView(this);
        title.setText(R.string.fitdax_name); title.setTextSize(38); title.setTextColor(Color.rgb(170,255,50)); title.setTypeface(font);
        layout.addView(title);
        status = new TextView(this); status.setTextSize(16); status.setTextColor(Color.WHITE); status.setTypeface(font);
        status.setPadding(0,24,0,24); status.setGravity(android.view.Gravity.CENTER);
        status.setText(getString(R.string.opening)); layout.addView(status);
        Button retry = new Button(this); retry.setTypeface(font);
        retry.setText(getString(R.string.open_app)); retry.setOnClickListener(v -> openApp()); layout.addView(retry);
        Button browser = new Button(this); browser.setTypeface(font);
        browser.setText(getString(R.string.open_browser)); browser.setOnClickListener(v -> openBrowser(null)); layout.addView(browser);
        TextView note = new TextView(this); note.setTypeface(font); note.setTextSize(12); note.setTextColor(Color.LTGRAY);
        note.setPadding(0,24,0,0); note.setGravity(android.view.Gravity.CENTER);
        note.setText(getString(R.string.live_updates)); layout.addView(note);
        setContentView(layout);
        layout.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(32,Math.max(48,insets.getSystemWindowInsetTop()),32,Math.max(48,insets.getSystemWindowInsetBottom()));return insets;});
        if (state == null) layout.post(this::openApp);
    }
    private void openApp() {
        if (opening || isFinishing()) return;
        opening = true;
        status.setText(getString(R.string.connect_browser));
        try {
            if (launcher != null) launcher.destroy();
            launcher = new TwaLauncher(this);
            TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(HOME);
            launcher.launch(builder, new CustomTabsCallback(), null,
                () -> { opening = false; finish(); },
                (context, fallbackBuilder, provider, completion) -> openBrowser(provider));
        } catch (RuntimeException error) {
            opening = false;
            status.setText(getString(R.string.launch_failure,error.getClass().getSimpleName()));
        }
    }
    private void openBrowser(String preferred) {
        opening = false;
        // Explicit browser package prevents an Android verified-link loop back into this app.
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"));
        probe.addCategory(Intent.CATEGORY_BROWSABLE);
        List<ResolveInfo> browsers = getPackageManager().queryIntentActivities(probe, 0);
        if (preferred != null && !preferred.equals(getPackageName()) && tryBrowser(preferred)) return;
        for (ResolveInfo browser : browsers) {
            String pkg = browser.activityInfo.packageName;
            if (!pkg.equals(getPackageName()) && tryBrowser(pkg)) return;
        }
        status.setText(getString(R.string.browser_missing));
    }
    private boolean tryBrowser(String pkg) {
        try {
            CustomTabsIntent tab = new CustomTabsIntent.Builder().setShowTitle(true).build();
            tab.intent.setPackage(pkg);
            tab.launchUrl(this, HOME);
            finish(); return true;
        } catch (RuntimeException error) { return false; }
    }
    @Override protected void onDestroy() { if (launcher != null) launcher.destroy(); super.onDestroy(); }
}
