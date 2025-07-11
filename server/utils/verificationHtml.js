 const verifyEmailTemplate =  ({ fullName, url }) => {
  return  `  <h2>Password Reset Request</h2>
        <p>dear${fullName}</p>
        <p>Click the link below to reset your password:</p>
        <a href="${url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>`
}
module.exports = verifyEmailTemplate;