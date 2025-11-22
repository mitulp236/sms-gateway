package com.smsforwarder;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONArray;
import org.json.JSONObject;

public class SmsSendWorker extends Worker {
  private static final String TAG = "SmsSendWorker";
  private static final String PREFS_NAME = "sms_config";

  public SmsSendWorker(@NonNull Context context, @NonNull WorkerParameters params) {
    super(context, params);
  }

  @NonNull
  @Override
  public Result doWork() {
    Log.d(TAG, "[doWork] background job started");

    String sender = getInputData().getString("sender");
    String body = getInputData().getString("body");
    String time = getInputData().getString("time");

    Log.d(TAG, "[doWork] SMS from: " + sender + " body: " + body.substring(0, Math.min(50, body.length())));

    // Load config from SharedPreferences
    SharedPreferences prefs = getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    String apiKey = prefs.getString("smtpPassword", null);
    String senderEmail = prefs.getString("smtpEmail", null);
    String targetEmail = prefs.getString("targetEmail", null);
    boolean serviceEnabled = prefs.getBoolean("service_enabled", false);

    Log.d(TAG, "[doWork] config: serviceEnabled=" + serviceEnabled + " senderEmail=" + senderEmail + " targetEmail=" + targetEmail);

    if (!serviceEnabled) {
      Log.d(TAG, "[doWork] service disabled, skipping");
      return Result.success();
    }

    if (apiKey == null || senderEmail == null || targetEmail == null) {
      Log.w(TAG, "[doWork] missing config (will retry)");
      return Result.retry();
    }

    try {
      // Build Brevo JSON payload
      JSONObject senderObj = new JSONObject();
      senderObj.put("name", "SMS Forwarder");
      senderObj.put("email", senderEmail);

      JSONObject toObj = new JSONObject();
      toObj.put("email", targetEmail);
      toObj.put("name", "You");

      JSONObject payload = new JSONObject();
      payload.put("sender", senderObj);
      payload.put("to", new JSONArray().put(toObj));
      payload.put("subject", "SMS from " + sender);
      payload.put("htmlContent",
          "<h3>📱 New SMS Received</h3><p><strong>From:</strong> " + sender
              + "</p><p><strong>Time:</strong> " + time + "</p><hr><p>" + body + "</p>");
      payload.put("textContent", "From: " + sender + "\nTime: " + time + "\n\nMessage:\n" + body);

      Log.d(TAG, "[doWork] sending to Brevo");

      // Send HTTP POST
      OkHttpClient client = new OkHttpClient();
      RequestBody requestBody = RequestBody.create(payload.toString(), MediaType.parse("application/json"));

      Request request = new Request.Builder()
          .url("https://api.brevo.com/v3/smtp/email")
          .addHeader("api-key", apiKey)
          .addHeader("accept", "application/json")
          .post(requestBody)
          .build();

      Response response = client.newCall(request).execute();
      int statusCode = response.code();
      String responseBody = response.body() != null ? response.body().string() : "";

      Log.d(TAG, "[doWork] Brevo response: status=" + statusCode + " body=" + responseBody);

      if (statusCode >= 200 && statusCode < 300) {
        Log.d(TAG, "[doWork] ✓ success");
        return Result.success();
      } else if (statusCode >= 500) {
        Log.w(TAG, "[doWork] server error, will retry");
        return Result.retry();
      } else {
        Log.w(TAG, "[doWork] client error: " + responseBody);
        return Result.failure();
      }
    } catch (Exception e) {
      Log.e(TAG, "[doWork] exception: " + e.getMessage());
      e.printStackTrace();
      return Result.retry();
    }
  }
}