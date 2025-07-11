import qrcode from 'qrcode';
import crypto from 'crypto';

// In a real app, you would store this secret and the generated token in a temporary cache (like Redis)
// For simplicity, we'll just generate and expect it.
const qrSecret = 'a-secret-for-qr-codes';
let activeQRCodeData = null;

// This would be called by a Facilitator/Manager to start a session
export const generateNewQRCode = (programId) => {
    const timestamp = Date.now();
    const dataToSign = `${programId}-${timestamp}`;
    const signature = crypto.createHmac('sha256', qrSecret).update(dataToSign).digest('hex');
    
    // The data includes the signature to prevent tampering
    const qrData = JSON.stringify({ programId, timestamp, signature });
    activeQRCodeData = qrData; // Store the currently active QR code data

    return qrcode.toDataURL(qrData); // Returns a base64 image of the QR code
};

export const verifyQRCode = (scannedData) => {
    try {
        const parsedData = JSON.parse(scannedData);
        const { programId, timestamp, signature } = parsedData;

        // Verify the signature
        const expectedSignature = crypto.createHmac('sha256', qrSecret)
            .update(`${programId}-${timestamp}`)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.log("QR Code signature mismatch.");
            return null;
        }

        // Check if it's the currently active code (optional, but good for security)
        if (scannedData !== activeQRCodeData) {
            console.log("Scanned QR Code is not the active one.");
            return null;
        }

        // Check if the QR code is still valid (e.g., within 2 minutes)
        const timeDifference = Date.now() - timestamp;
        if (timeDifference > 120000) { // 2 minutes
            console.log("QR Code has expired.");
            return null;
        }

        return { programId };

    } catch (error) {
        console.error("Error verifying QR Code:", error);
        return null;
    }
};