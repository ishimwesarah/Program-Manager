import PDFDocument from 'pdfkit';

export const generateProgramReportPDF = (programData, attendanceData, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(`Program Report: ${programData.name}`, { align: 'center' });
    doc.moveDown();

    // Program Details
    doc.fontSize(14).text('Program Details', { underline: true });
    doc.fontSize(12).text(`Manager: ${programData.programManager.name}`);
    doc.text(`Status: ${programData.status}`);
    doc.text(`Duration: ${new Date(programData.startDate).toLocaleDateString()} to ${new Date(programData.endDate).toLocaleDateString()}`);
    doc.moveDown();

    // Attendance
    doc.fontSize(14).text('Attendance Records', { underline: true });
    if (attendanceData.length === 0) {
        doc.fontSize(12).text('No attendance records found for the selected period.');
    } else {
        attendanceData.forEach(record => {
            const checkIn = new Date(record.checkInTime).toLocaleTimeString();
            const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A';
            doc.fontSize(10).text(
                `Trainee: ${record.user.name} | Date: ${record.date} | Check-in: ${checkIn} | Check-out: ${checkOut}`
            );
        });
    }

    doc.end();
};