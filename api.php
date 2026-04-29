<?php

use App\Http\Controllers\Api\V1\Report\AdminApprovalInvoiceController;
use App\Http\Controllers\Api\V1\Report\ConversionReportController;
use App\Http\Controllers\Api\V1\Report\ReportController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Report\InvoiceReportController;

use App\Http\Controllers\Api\V1\TeamController;

Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/reports/unified-invoices', [InvoiceReportController::class, 'index']);
    Route::get('/reports/request-invoices-list', [InvoiceReportController::class, 'requestedInvoicesList'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/request-cancel-invoices-list', [InvoiceReportController::class, 'requestCancelledInvoicesList'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/request-edit-invoices-list', [InvoiceReportController::class, 'requestEditInvoicesList'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/cancelled-invoices-list', [InvoiceReportController::class, 'cancelledInvoicesList'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/invoices-list', [InvoiceReportController::class, 'invoicesList'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::post('reports/request-invoice/{id}/update-invoice-no', [InvoiceReportController::class, 'updateInvoiceNo'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/unpaid-invoices', [InvoiceReportController::class, 'unpaidInvoices'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::post('/reports/cancel-invoice-action/{project_invoice_id}/{status}', [InvoiceReportController::class, 'cancelInvoiceAction'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::post('reports/invoice/{id}/move-from-cancel', [InvoiceReportController::class, 'moveFromCancelled'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/permissions', [InvoiceReportController::class, 'permissions']);
    Route::get('/reports/approve-discount', [InvoiceReportController::class, 'approveDiscount'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::post('/reports/approve-discount-action', [InvoiceReportController::class, 'approveOrRejectInvoiceDiscount'])->middleware('check.permission:REPORT_PERMISSIONS,invoice_report');
    Route::get('/reports/get-payment-review-details', [InvoiceReportController::class, 'getPaymentReviewDetails']);
    Route::get('/reports/get-payment-list', [InvoiceReportController::class, 'getPaymentList'])->middleware('check.permission:REPORT_PERMISSIONS,payment_list_report');
    Route::get('/reports/get-transactions-list', [InvoiceReportController::class, 'getTransactionsList'])->middleware('check.permission:REPORT_PERMISSIONS,transaction_list_report');
    Route::get('/reports/get-transactions-project', [InvoiceReportController::class, 'getTransactionsProject']);
    Route::post('/reports/transactions-add', [InvoiceReportController::class, 'storeTransactions'])->middleware('check.permission:REPORT_PERMISSIONS,transaction_list_report');
    Route::put('/reports/transactions/{id}', [InvoiceReportController::class, 'updateTransaction'])->middleware('check.permission:REPORT_PERMISSIONS,transaction_list_report');
    Route::get('/reports/transactions-edit/{id}', [InvoiceReportController::class, 'editTransaction'])->middleware('check.permission:REPORT_PERMISSIONS,transaction_list_report');
    Route::post('/reports/transactions/{id}/delete', [InvoiceReportController::class, 'deleteTransaction'])->middleware('check.permission:REPORT_PERMISSIONS,transaction_list_report');
    Route::get('/reports/transactions-text/{id}', [InvoiceReportController::class, 'getTransactionText']);
    Route::post('/reports/approval-invoices', [AdminApprovalInvoiceController::class, 'index'])->middleware('check.permission:REPORT_PERMISSIONS,approve_payment_report');
    Route::post('/reports/approval-payment', [AdminApprovalInvoiceController::class, 'approveInvoicePayment']);
    Route::post('/reports/set-project-flag/{projectId}', [AdminApprovalInvoiceController::class, 'setProjectFlag']);
    Route::get('/reports/get-estimations-report',[AdminApprovalInvoiceController::class,'getEstimationReport']);
    Route::get('/reports/get-occupancy-report',[AdminApprovalInvoiceController::class, 'getOccupancyReport']);
    
});



Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Route::get('/reports/last-6-months', [ReportController::class, 'last6MonthsReport']);
    Route::get('/reports/last-6-months', [ReportController::class, 'last6MonthsReport'])->middleware('check.permission:REPORT_PERMISSIONS,six_month_report');
    Route::get('/reports/conversion', [ReportController::class, 'conversionReport']);
    Route::get('/reports/last-6-months-dev', [ReportController::class, 'last6monthsDev']);
    Route::get('/reports/paymentsInformation', [ReportController::class, 'last6MonthPayments']);
    Route::get('reports/last6-month-payment-mode', [ReportController::class, 'last6MonthPaymentByMode']);
    Route::get('reports/unpaid-payments', [ReportController::class, 'unpaidPayments']);
    Route::get('/reports/last-6-months-uk', [ReportController::class, 'last6monthsUk']);
    Route::get('reports/last-6-months-uk/{subType?}', [ReportController::class, 'last6MonthsUk'])
        ->where('subType', 'modelc');
    // Route::get('/reports/compare-graph', [ReportController::class, 'compareGraph']);
    Route::get('/reports/compare-graph', [ReportController::class, 'compareGraph'])->middleware('check.permission:REPORT_PERMISSIONS,compare_report');
    Route::get('/reports/monthly-revanue', [ReportController::class, 'monthlyRevanue']);
    Route::get('/reports/tech-revenue', [ReportController::class, 'last6monthsTech']);
    Route::get('/reports/technology-payments', [ReportController::class, 'getTechnologyAmountData']);
    Route::get('/reports/developer-list', [ReportController::class, 'teamDeveloperList']);
    Route::post('/reports/add-developer-comment/{devId}', [ReportController::class, 'addDeveloperComment']);

    Route::get('/team/team-details2', [TeamController::class, 'index2']);
    Route::get('/team/team-details', [TeamController::class, 'index']);

    Route::get('/team-report', [TeamController::class, 'teamReport']);

    Route::post('reports/client-payment-list', [ReportController::class, 'clientPaymentList']);
    Route::post('reports/payment-review-list', [ReportController::class, 'paymentReviewList']);
    Route::post('reports/update-exclude-contact', [ReportController::class, 'updateExcludeContact']);
    Route::get('reports/client-payment-list/download', [ReportController::class, 'downloadClientPaymentListCsv']);
    Route::get('reports/payment-review-csv', [ReportController::class, 'paymentReviewCsv']);

    Route::get('reports/paypal-report', [ReportController::class, 'paypalReport']);
    Route::get('reports/loelist', [ReportController::class, 'loeList']);
    Route::get('reports/other-loelist', [ReportController::class, 'otherLoeList']);
    Route::post('reports/other-loe-add', [ReportController::class, 'otherLoeAdd']);
    Route::get('reports/reward-scheme', [ReportController::class, 'rewardScheme']);

    Route::get('reports/company-list', [ReportController::class, 'projectContactsList']);
    
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    Route::get('/reports/conversion', [ConversionReportController::class, 'index']);
    Route::get('reports/lead-list', [ConversionReportController::class, 'leadList']);   
    Route::get('reports/project-list', [ConversionReportController::class, 'projectList']);
    Route::get('reports/ba-lead-list', [ConversionReportController::class, 'baLeadList']);
    Route::get('reports/project-without-lead', [ConversionReportController::class, 'projectWithoutLead']);

    Route::get('reports/project-convert-tech', [ConversionReportController::class, 'projectConvertTech']);
});
