package com.citibooks.app;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class DashboardActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        String employeeName = getIntent().getStringExtra("employeeName");
        TextView title = findViewById(R.id.employeeTitle);
        title.setText(getString(R.string.welcome_employee, employeeName));
    }
}
