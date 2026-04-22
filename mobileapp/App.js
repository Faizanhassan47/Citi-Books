import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_APP_URL || '').trim();

function buildBridgeInjection(payload) {
  const serializedPayload = JSON.stringify(payload);

  return `
    (function() {
      const data = ${JSON.stringify(serializedPayload)};
      const windowEvent = new MessageEvent('message', { data: data });
      const documentEvent = new MessageEvent('message', { data: data });
      window.dispatchEvent(windowEvent);
      document.dispatchEvent(documentEvent);
      window.dispatchEvent(new CustomEvent('citibooks-native-message', { detail: { data: data } }));
    })();
    true;
  `;
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webError, setWebError] = useState(null);
  const webViewRef = useRef(null);
  const locationSub = useRef(null);

  const sendMessageToWeb = useCallback((payload) => {
    if (!webViewRef.current) {
      return;
    }

    webViewRef.current.injectJavaScript(buildBridgeInjection(payload));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (cancelled) {
        return;
      }

      if (status !== 'granted') {
        setErrorMsg('Live location permission was denied. Attendance will fall back to browser location if available.');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          if (cancelled) {
            return;
          }

          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          setLocation(coords);
          sendMessageToWeb({
            type: 'LOCATION_UPDATE',
            data: coords,
            coords
          });
        }
      );

      if (cancelled) {
        subscription.remove();
        return;
      }

      locationSub.current = subscription;
    })();

    return () => {
      cancelled = true;
      locationSub.current?.remove();
    };
  }, [sendMessageToWeb]);

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'GET_LOCATION' && location) {
        sendMessageToWeb({
          type: 'LOCATION_UPDATE',
          data: location,
          coords: location
        });
      }
    } catch (e) {
      console.warn('Bridge error:', e);
    }
  }, [location, sendMessageToWeb]);

  if (!WEB_APP_URL) {
    return (
      <View style={[styles.loading, { padding: 32 }]}>
        <Text style={styles.errorIcon}>Config</Text>
        <Text style={[styles.loadingText, { textAlign: 'center', marginTop: 16 }]}>
          Missing mobile web portal URL
        </Text>
        <Text style={styles.helperText}>
          Set EXPO_PUBLIC_WEB_APP_URL in mobileapp/.env before starting the app.
        </Text>
      </View>
    );
  }

  if (webError) {
    return (
      <View style={[styles.loading, { padding: 32 }]}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={[styles.loadingText, { textAlign: 'center', marginTop: 16 }]}>
          Cannot connect to CitiBooks server
        </Text>
        <Text style={styles.helperText}>
          Make sure the web server is running and EXPO_PUBLIC_WEB_APP_URL is correct.
          {'\n\n'}
          Trying: {WEB_APP_URL}
        </Text>
        <Text
          style={styles.retryText}
          onPress={() => {
            setWebError(null);
            setIsLoading(true);
            webViewRef.current?.reload();
          }}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        originWhitelist={['*']}
        onLoadEnd={() => {
          setIsLoading(false);
          if (location) {
            sendMessageToWeb({
              type: 'LOCATION_UPDATE',
              data: location,
              coords: location
            });
          }
        }}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setWebError(nativeEvent.description || 'Connection failed');
          setIsLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 400) {
            setWebError(`Server error: ${nativeEvent.statusCode}`);
            setIsLoading(false);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#5E3A8D" />
            <Text style={styles.loadingText}>Connecting to CitiBooks...</Text>
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#5E3A8D" />
          <Text style={styles.loadingText}>Syncing Enterprise Hub...</Text>
        </View>
      )}
      {errorMsg && !webError && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight || 0,
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#5E3A8D',
  },
  errorIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5E3A8D',
  },
  helperText: {
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  retryText: {
    marginTop: 24,
    color: '#5E3A8D',
    fontWeight: '700',
    fontSize: 15,
  },
  warningBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  warningBannerText: {
    color: '#9a3412',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  }
});
