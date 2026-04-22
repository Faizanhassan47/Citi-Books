package com.citibooks.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private EditText usernameInput;
    private EditText passwordInput;
    private TextView helperText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        usernameInput = findViewById(R.id.usernameInput);
        passwordInput = findViewById(R.id.passwordInput);
        helperText = findViewById(R.id.helperText);
        Button loginButton = findViewById(R.id.loginButton);

        usernameInput.setText("employee");
        passwordInput.setText("employee123");

        loginButton.setOnClickListener(view -> {
            if (usernameInput.getText().toString().trim().isEmpty() || passwordInput.getText().toString().trim().isEmpty()) {
                helperText.setText(R.string.login_error);
                return;
            }

            Intent intent = new Intent(MainActivity.this, DashboardActivity.class);
            intent.putExtra("employeeName", "Ayesha Khan");
            startActivity(intent);
        });
    }
}
