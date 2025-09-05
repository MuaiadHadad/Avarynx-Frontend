<?php
$conName = $_POST['conName'];
$conLName = $_POST['conLName'];
$conEmail = $_POST['conEmail'];
$conPhone = $_POST['conPhone'];
$conService = $_POST['conService'];
$conMessage = $_POST['conMessage'];

ini_set('display_errors', 1);
error_reporting(E_ALL);

/**
 * Set the recipient email address.
 * 
 * FIXME: Update this to your desired email address.
 */
$recipient = "support@themejunction.net";

// Set the email subject.
$sender = $conName . " { " . $conEmail . " }";


//Email Header
$head = "You have a new message from your Gerold website Contact Form\n=============================";

// Build the email content.
$form_content = "$head\n\n";

$form_content .= "Full Name: $conName $conLName\n";

$form_content .= "Email: $conEmail\n";

$form_content .= "Phone: $conPhone\n";

$form_content .= "Service: $conService\n";

$form_content .= "Message: \n$conMessage\n";


// Build the email headers.
$headers = "From: $conName < $conEmail >\r\n" .
  "Reply-To:" . $conEmail . "\r\n" .
  'X-Mailer: PHP/' . phpversion();

if (mail($recipient, $sender, $form_content, $headers)) {
  echo "Y";
} else {
  echo "N";
}
