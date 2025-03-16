
$(document).ready(function() {
   
    const salesTable = $('#salesTable').DataTable({
        responsive: true,
        order: [[1, 'desc']]
    });

   
    $('#filter').on('change', function() {
        const dateInputs = $('.date-inputs');
        if ($(this).val() === 'custom') {
            dateInputs.removeClass('d-none');
        } else {
            dateInputs.addClass('d-none');
        }
        
    });

   
    $('#generateReport').on('click', async function() {
        const button = $(this);
        const buttonText = button.find('.button-text');
        const spinner = button.find('.spinner-border');
        const filter = $('#filter').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

      
        if (filter === 'custom' && (!startDate || !endDate)) {
    Swal.fire({
        icon: 'warning',  
        title: 'Missing Dates!',
        text: 'Please select both start and end dates for the custom filter.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    });
    return;
}


      
        buttonText.addClass('d-none');
        spinner.removeClass('d-none');
        button.prop('disabled', true);

        try {
           
            const response = await $.ajax({
                url: '/admin/sales-report-data',
                method: 'GET',
                data: { filter, startDate, endDate }
            });

            
            salesTable.clear();
            response.result.forEach(item => {
                salesTable.row.add([
                    `${item.productName} ${item.size}`,
                    item.soldCount,
                    item.returnedCount,
                     `₹${item.offerDiscounts.toFixed(2)}`,
                    `₹${item.revenue.toFixed(2)}`
                ]);
            });
            salesTable.draw();

            
            $('#discounts').text(`Offer Discounts: ₹${response.totalOfferDiscounts.toFixed(2)}`);
            $('#coupon-discounts').text(`Coupon Discounts: ₹${response.totalCouponDiscount.toFixed(2)}`);
            $('#overall-sales-count').text(`Overall Sales Count: ${response.totalSold}`);
            $('#overall-order-amount').text(`Order Count: ${response.totalSold + response.totalReturns}`);
            $('#overall-discount').text(`Overall Discount: ₹${response.overallDiscount.toFixed(2)}`);
            $('#net-revenue').text(`Net Revenue: ₹${response.netRevenue.toFixed(2)}`);

        } catch (error) {
            console.error('Error fetching report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
           
            buttonText.removeClass('d-none');
            spinner.addClass('d-none');
            button.prop('disabled', false);
        }
    });


    $('#downloadExcel, #downloadPDF').on('click', function() {
        const format = $(this).attr('id') === 'downloadExcel' ? 'excel' : 'pdf';
        const filter = $('#filter').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        const params = new URLSearchParams({
            format,
            filter,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        });

        window.location.href = `/admin/sales-report-download?${params.toString()}`;
    });
});

document.addEventListener("DOMContentLoaded", function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});