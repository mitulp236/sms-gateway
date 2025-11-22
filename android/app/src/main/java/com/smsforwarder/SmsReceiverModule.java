package com.smsforwarder;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SmsReceiverModule extends ReactContextBaseJavaModule {
  private static final String TAG = "SmsReceiverModule";
  private static final String PREFS_NAME = "sms_config";
  private static ReactApplicationContext staticReactContext = null;

  public SmsReceiverModule(ReactApplicationContext reactContext) {
    super(reactContext);
    staticReactContext = reactContext;
    Log.d(TAG, "[SmsReceiverModule] initialized");
  }

  @Override
  public String getName() {
    return "SmsReceiverModule";
  }

  public static ReactApplicationContext getReactContext() {
    return staticReactContext;
  }

  public static void emitSmsEvent(String sender, String body, String time) {
    if (staticReactContext != null && staticReactContext.hasActiveCatalystInstance()) {
      try {
        WritableMap params = Arguments.createMap();
        params.putString("originatingAddress", sender);
        params.putString("messageBody", body);
        params.putString("time", time);

        staticReactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onSmsReceived", params);
        Log.d(TAG, "[emitSmsEvent] ✅ event emitted to JS");
      } catch (Exception e) {
        Log.e(TAG, "[emitSmsEvent] error: " + e.getMessage());
        e.printStackTrace();
      }
    } else {
      Log.w(TAG, "[emitSmsEvent] staticReactContext not available or no catalyst instance");
    }
  }

  @ReactMethod
  public void syncConfigToNative(String targetEmail, String smtpEmail, String smtpPassword, boolean serviceEnabled) {
    try {
      SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
      SharedPreferences.Editor editor = prefs.edit();
      editor.putString("targetEmail", targetEmail);
      editor.putString("smtpEmail", smtpEmail);
      editor.putString("smtpPassword", smtpPassword);
      editor.putBoolean("service_enabled", serviceEnabled);
      editor.apply();
      Log.d(TAG, "[syncConfigToNative] ✅ config synced: serviceEnabled=" + serviceEnabled);
    } catch (Exception e) {
      Log.e(TAG, "[syncConfigToNative] error: " + e.getMessage());
      e.printStackTrace();
    }
  }
}