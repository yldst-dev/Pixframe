package com.yldst.pixframe;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        disableWebViewLongPress();
    }

    private void disableWebViewLongPress() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        WebView webView = bridge.getWebView();
        webView.setLongClickable(false);
        webView.setHapticFeedbackEnabled(false);
        webView.setOnLongClickListener(v -> true);
        webView.setOnCreateContextMenuListener((menu, v, menuInfo) -> menu.clear());
    }
}
