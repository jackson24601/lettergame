import SwiftUI
import WebKit

struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webpagePreferences = WKWebpagePreferences()
        webpagePreferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = webpagePreferences
        configuration.allowsInlineMediaPlayback = true
        configuration.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.71, green: 0.96, blue: 1.0, alpha: 1.0)
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        loadGame(in: webView)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
    }

    private func loadGame(in webView: WKWebView) {
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html") else {
            webView.loadHTMLString("<h1>Letter Lagoon could not load.</h1>", baseURL: nil)
            return
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: Bundle.main.bundleURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.isFileURL || url.scheme == "about" {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
            }
        }
    }
}
