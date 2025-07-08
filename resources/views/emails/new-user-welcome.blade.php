<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Ticketing System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #B8860B, #DAA520);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #ddd;
        }
        .credentials-box {
            background: #fff;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .credential-item {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #555;
        }
        .credential-value {
            font-size: 16px;
            font-weight: bold;
            color: #4CAF50;
            background: #f8f8f8;
            padding: 8px;
            border-radius: 5px;
            border: 1px solid #ddd;
            display: inline-block;
            font-family: monospace;
            margin-left: 10px;
        }
        .warning {
            background: #e8f5e8;
            border: 1px solid #4CAF50;
            color: #2e7d32;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info-box {
            background: #e3f2fd;
            border: 1px solid #2196F3;
            color: #1565c0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #ddd;
        }
        .btn {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
        .feature-list {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .feature-list ul {
            margin: 0;
            padding-left: 20px;
        }
        .feature-list li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome to Ticketing System!</h1>
        <p>Your account has been created successfully</p>
    </div>
    
    <div class="content">
        <h2>Hello {{ $user->name }},</h2>
        
        <p>Welcome to the Ticketing System! Your account has been created and you can now access the platform to manage your devices and submit tickets.</p>
        
        <div class="credentials-box">
            <h3>🔑 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">{{ $user->email }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">{{ $tempPassword }}</span>
            </div>
        </div>
        
        <div class="warning">
            <strong>🛡️ Important Security Information:</strong>
            <ul>
                <li>Your initial password is the same as your email address</li>
                <li><strong>Please change your password immediately</strong> after your first login for security reasons</li>
                <li>Keep your login credentials secure and don't share them with anyone</li>
                <li>If you suspect any unauthorized access, contact your administrator immediately</li>
            </ul>
        </div>

        <div class="feature-list">
            <h3>🚀 What you can do with your account:</h3>
            <ul>
                <li><strong>Device Management:</strong> View and manage your assigned devices</li>
                <li><strong>Submit Tickets:</strong> Report issues with your devices</li>
                <li><strong>Track Progress:</strong> Monitor the status of your support tickets</li>
                <li><strong>View History:</strong> Access your complete ticket history</li>
                <li><strong>Profile Management:</strong> Update your personal information</li>
            </ul>
        </div>

        <div class="info-box">
            <h3>📱 Mobile Access Available</h3>
            <p>You can also access the system through our mobile app using the same login credentials. Contact your administrator for mobile app details.</p>
        </div>
        
        <h3>🔧 How to change your password:</h3>
        <ol>
            <li>Log in to the system using your email and the password above</li>
            <li>Navigate to your profile settings</li>
            <li>Select "Change Password"</li>
            <li>Enter your current password and choose a new, secure password</li>
            <li>Save your changes</li>
        </ol>
        
        <p><strong>Account Information:</strong></p>
        <ul>
            <li><strong>Full Name:</strong> {{ $user->name }}</li>
            <li><strong>Email Address:</strong> {{ $user->email }}</li>
            <li><strong>Account Type:</strong> Member</li>
            <li><strong>Account Created:</strong> {{ now()->format('F j, Y \a\t g:i A') }}</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <p><strong>Need Help?</strong></p>
            <p>If you have any questions or need assistance, please contact your building administrator or technical support team.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated welcome message from the Ticketing System.</p>
        <p>Please do not reply to this email. For support, contact your administrator.</p>
        <hr>
        <small>© {{ date('Y') }} Ticketing System. All rights reserved.</small>
    </div>
</body>
</html>
