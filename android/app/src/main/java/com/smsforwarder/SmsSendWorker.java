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
import org.json.JSONTokener;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

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
    long timestamp = getInputData().getLong("time", System.currentTimeMillis()); // Default to current time if missing

    // Convert timestamp to human-readable format
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
    String time = dateFormat.format(new Date(timestamp));

    Log.d(TAG, "[doWork] SMS from: " + sender + " body: " + body + " time: " + time);

    // Escape special characters in the message body
    String escapedBody = body
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");

    // Make links clickable in the message body
    String clickableBody = escapedBody.replaceAll(
        "(https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+)",
        "<a href=\"$1\" target=\"_blank\">$1</a>"
    );

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
      // Load email template from JSON file in assets
      InputStream inputStream = getApplicationContext().getAssets().open("email-template.json");
      int size = inputStream.available();
      byte[] buffer = new byte[size];
      inputStream.read(buffer);
      inputStream.close();
      String jsonString = new String(buffer, "UTF-8");
      JSONObject jsonObject = (JSONObject) new JSONTokener(jsonString).nextValue();
      String emailTemplate = jsonObject.getString("template");

      // Replace placeholders in the email template
      String htmlContent = emailTemplate
          .replace("{{sender}}", sender)
          .replace("{{time}}", time)
          .replace("{{body}}", clickableBody);

      // Build Brevo JSON payload
      JSONObject senderObj = new JSONObject();
      senderObj.put("name", "SMS Gateway"); // Consistent sender name
      senderObj.put("email", senderEmail);

      JSONObject toObj = new JSONObject();
      toObj.put("email", targetEmail);
      toObj.put("name", "You");

      JSONObject payload = new JSONObject();
      payload.put("sender", senderObj);
      payload.put("to", new JSONArray().put(toObj));
      payload.put("subject", "SMS from " + sender);
      payload.put("htmlContent", htmlContent);
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