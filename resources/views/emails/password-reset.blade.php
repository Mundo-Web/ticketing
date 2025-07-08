<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Ticketing System</title>
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
        .password-box {
            background: #fff;
            border: 2px solid #B8860B;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .password {
            font-size: 18px;
            font-weight: bold;
            color: #B8860B;
            background: #f8f8f8;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ddd;
            display: inline-block;
            font-family: monospace;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
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
            background: #B8860B;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Password Reset</h1>
        <p>Your password has been successfully reset</p>
    </div>
    
    <div class="content">
        <h2>Hello {{ $user->name }},</h2>
        
        <p>Your password has been reset for your account in the Ticketing System. Your new temporary password is:</p>
        
        <div class="password-box">
            <p><strong>Temporary Password:</strong></p>
            <div class="password">{{ $tempPassword }}</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <ul>
                <li>This is a temporary password that is the same as your email address</li>
                <li>Please log in and change your password immediately for security reasons</li>
                <li>Do not share this email with anyone</li>
                <li>If you did not request this password reset, please contact your administrator</li>
            </ul>
        </div>
        
        <h3>How to change your password:</h3>
        <ol>
            <li>Log in to the system using your email and the temporary password above</li>
            <li>Go to your profile settings</li>
            <li>Select "Change Password"</li>
            <li>Enter your temporary password and choose a new, secure password</li>
        </ol>
        
        <p><strong>Account Details:</strong></p>
        <ul>
            <li><strong>Email:</strong> {{ $user->email }}</li>
            <li><strong>Reset Date:</strong> {{ now()->format('F j, Y \a\t g:i A') }}</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>This is an automated message from the Ticketing System.</p>
        <p>If you have any questions, please contact your system administrator.</p>
        <hr>
        <small>© {{ date('Y') }} Ticketing System. All rights reserved.</small>
    </div>
</body>
</html>
