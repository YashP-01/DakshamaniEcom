-- Promote a user to Admin by Email
-- Replace 'your_email@example.com' with the email you registered with

UPDATE customers 
SET 
  is_admin = true,
  is_active = true
WHERE email = 'your_email@example.com'; -- <--- CHANGE THIS EMAIL

-- Verify the update
SELECT id, email, is_admin FROM customers WHERE email = 'your_email@example.com';
