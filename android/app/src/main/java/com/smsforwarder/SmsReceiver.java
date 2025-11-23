package com.smsforwarder;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

public class SmsReceiver extends BroadcastReceiver {
  private static final String TAG = "SmsReceiver";
  private static final String PREFS_NAME = "sms_config";

@Override
public void onReceive(Context context, Intent intent) {
    Log.d(TAG, "[onReceive] ============ SMS RECEIVED ============");
    Log.d(TAG, "[onReceive] Action: " + intent.getAction());

    if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
        SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);

        if (messages != null && messages.length > 0) {
            SmsMessage sms = messages[0];
            String sender = sms.getOriginatingAddress();
            String body = sms.getMessageBody();
            String time = String.valueOf(System.currentTimeMillis());

            Log.d(TAG, "[onReceive] SMS from: " + sender);
            Log.d(TAG, "[onReceive] SMS body: " + body);

            // Check if service is enabled
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean serviceEnabled = prefs.getBoolean("service_enabled", false);

            if (!serviceEnabled) {
                Log.d(TAG, "[onReceive] ❌ Service DISABLED - ignoring SMS");
                return;
            }

            // Emit to React Native only if app is in foreground
            boolean emittedToRN = false;
            try {
                SmsReceiverModule.emitSmsEvent(sender, body, time);
                Log.d(TAG, "[onReceive] ✅ Emitted to React Native");
                emittedToRN = true;
            } catch (Exception e) {
                Log.w(TAG, "[onReceive] ⚠️ RN emit failed (app likely closed): " + e.getMessage());
                emittedToRN = false;
            }

            // Queue WorkManager job for background processing
            Log.d(TAG, "[onReceive] Queuing WorkManager background job...");
            queueBackgroundSend(context, sender, body, time);
        }
    }
}

  private void queueBackgroundSend(Context context, String sender, String body, String time) {
    try {
      Data inputData = new Data.Builder()
          .putString("sender", sender)
          .putString("body", body)
          .putString("time", time)
          .build();

      OneTimeWorkRequest sendRequest = new OneTimeWorkRequest.Builder(SmsSendWorker.class)
          .setInputData(inputData)
          .build();

      WorkManager.getInstance(context).enqueue(sendRequest);
      Log.d(TAG, "[queueBackgroundSend] ✅ WorkManager job queued: " + sendRequest.getId());
    } catch (Exception e) {
      Log.e(TAG, "[queueBackgroundSend] ❌ error: " + e.getMessage());
      e.printStackTrace();
    }
  }
}