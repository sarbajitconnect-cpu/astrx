package com.astra.ai;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure WebView media and DOM storage settings
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
        }

        // Native Android back-button navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView view = getBridge().getWebView();
                if (view != null) {
                    view.evaluateJavascript(
                        "(function() { " +
                        "  var backdrop = document.getElementById('sidebarBackdrop'); " +
                        "  var sidebar = document.getElementById('sidebar'); " +
                        "  if (sidebar && sidebar.classList.contains('mobile-open')) { " +
                        "    sidebar.classList.remove('mobile-open'); " +
                        "    if (backdrop) backdrop.classList.add('hidden'); " +
                        "    return 'closed_sidebar'; " +
                        "  } " +
                        "  var activeModal = document.querySelector('.modal-overlay:not(.hidden), .auth-modal-overlay:not(.hidden), .disappearing-chat-modal-overlay:not(.hidden), .camera-modal-overlay:not(.hidden)'); " +
                        "  if (activeModal) { " +
                        "    activeModal.classList.add('hidden'); " +
                        "    return 'closed_modal'; " +
                        "  } " +
                        "  return 'none'; " +
                        "})()",
                        value -> {
                            if (value == null || value.contains("none")) {
                                if (view.canGoBack()) {
                                    view.goBack();
                                } else {
                                    setEnabled(false);
                                    getOnBackPressedDispatcher().onBackPressed();
                                    setEnabled(true);
                                }
                            }
                        }
                    );
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }
}
