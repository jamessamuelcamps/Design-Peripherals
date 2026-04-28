export const WEB = {
  projectId: 3383028,
  sections: [
    { name: 'Payments',     events: ['Viewed VIEWED_PAYMENTS'] },
    { name: 'Accounts',     events: ['Viewed VIEWED_ACCOUNTS', 'ADMIN_ACCOUNTS_HOME_SCREEN_LOADED_WEB', 'MEMBER_ACCOUNTS_HOME_SCREEN_LOADED_WEB', 'CARD_ONLY_ACCOUNTS_HOME_SCREEN_LOADED_WEB', 'PAYMENT_APPROVER_ACCOUNTS_HOME_SCREEN_LOADED_WEB', 'PAYMENT_MAKER_ACCOUNTS_HOME_SCREEN_LOADED_WEB', 'PAYMENT_REQUESTER_ACCOUNTS_HOME_SCREEN_LOADED_WEB'] },
    { name: 'Applications Hub', events: ['Viewed VIEWED_ONBOARDING'] },
    { name: 'Cards',        events: ['Viewed VIEWED_CARDS'] },
    { name: 'Profile',      events: ['Viewed VIEWED_PROFILE'] },
    { name: 'Integrations', events: ['Viewed VIEWED_INTEGRATIONS'] },
    { name: 'Transfers',    events: ['Viewed VIEWED_TRANSFERS'] },
  ],
  paymentBreakdown: [
    { name: 'Payables',        events: ['Viewed VIEWED_PAYABLES'] },
    { name: 'Receivables',     events: ['Viewed VIEWED_RECEIVABLES'] },
    { name: 'Bulk Payments',   events: ['VALIDATE_BULK_CSV_SUCCESS'] },
    { name: 'Bill Pay',        events: ['BILLPAY_BILL_SUBMITTED'] },
    { name: 'Invoices Issued', events: ['INVOICE_ISSUED'] },
    { name: 'Recipients',      events: ['Viewed VIEWED_RECIPIENTS'] },
  ],
  onboardingFunnel: [
    { step: 'Clicked Add a Company', event: 'CLICKED_ADD_A_COMPANY' },
    { step: 'Onboarding Landing',    event: 'Viewed VIEWED_ONBOARDING_LANDING' },
    { step: 'Company Search',        event: 'Viewed VIEWED_ONBOARDING_COMPANY_SEARCH' },
    { step: 'Company Selected',      event: 'ONBOARDING_COMPANY_SELECTED' },
    { step: 'Application Submitted', event: 'ONBOARDING_APPLICATION_SUBMITTED' },
  ],
  featureAdoption: [
    { name: 'Invoices Issued',               event: 'INVOICE_ISSUED' },
    { name: 'Bills Submitted',               event: 'BILLPAY_BILL_SUBMITTED' },
    { name: 'Bulk Payments',                 event: 'VALIDATE_BULK_CSV_SUCCESS' },
    { name: 'Invoice Payments Recorded',     event: 'INVOICE_PAYMENT_RECORDED' },
    { name: 'Accounting Integrations Setup', event: 'PRESSED_GET_STARTED_WITH_ACCOUNTING_INTEGRATION_BUTTON' },
  ],
};

export const MOBILE = {
  projectId: 2746665,
  sections: [
    { name: 'Accounts / Home', events: ['Viewed AccountsHomeScreen', 'Viewed HomeScreen', 'ADMIN_ACCOUNTS_HOME_SCREEN_SCREEN_LOADED_MOBILE', 'MEMBER_ACCOUNTS_HOME_SCREEN_SCREEN_LOADED_MOBILE', 'PAYMENT_APPROVER_ACCOUNTS_HOME_SCREEN_SCREEN_LOADED_MOBILE', 'PAYMENT_MAKER_ACCOUNTS_HOME_SCREEN_SCREEN_LOADED_MOBILE', 'PAYMENT_REQUESTER_ACCOUNTS_HOME_SCREEN_SCREEN_LOADED_MOBILE'] },
    { name: 'Payments',        events: ['Viewed PaymentsHubScreen', 'Viewed SendMoneyScreen', 'Viewed ReviewPaymentScreen', 'Viewed PaymentApprovalsScreen', 'Viewed BulkPaymentsScreen'] },
    { name: 'Transactions',    events: ['Viewed TransactionDetailsScreen'] },
    { name: 'Cards',           events: ['Viewed CardScreen', 'Viewed ActivateCardScreen', 'Viewed OrderCardReviewScreen'] },
    { name: 'International',   events: ['Viewed FxQuoteScreen', 'Viewed FxTransferDetailsScreen', 'Viewed FxRecipientDetailsScreen', 'Viewed FxReviewTransferScreen'] },
    { name: 'Direct Debits',   events: ['Viewed DirectDebitsScreen', 'Viewed DirectDebitDetailsScreen'] },
    { name: 'Profile / Settings', events: ['Viewed SettingsScreen', 'Viewed CompanyDetailsScreen', 'Viewed UserDetailsScreen', 'Viewed AccountMembersScreen'] },
  ],
  paymentBreakdown: [
    { name: 'Single Payments',   events: ['COMPLETED_PAYMENT_FLOW'] },
    { name: 'Payment Requests',  events: ['PRESSED_CONFIRM_CREATE_PAYMENT_REQUEST'] },
    { name: 'Bulk',              events: ['CONFIRMED_APPROVAL_OF_BULK_REQUEST'] },
    { name: 'International / FX',events: ['Viewed FxQuoteScreen'] },
    { name: 'Direct Debit',      events: ['Viewed DirectDebitsScreen'] },
  ],
  onboardingFunnel: [
    { step: 'Welcome Screen',        event: 'Viewed WelcomeScreen' },
    { step: 'Company Search',        event: 'Viewed SearchCompaniesHouseScreen' },
    { step: 'Details Confirmed',     event: 'Viewed ConfirmCompanyDetailsScreen' },
    { step: 'IDV Submitted',         event: 'IDV_SUBMITTED' },
    { step: 'Eligibility Submitted', event: 'ELIGIBILITY_FORM_SUBMITTED' },
  ],
  featureAdoption: [
    { name: 'Cards Ordered',       event: 'PRESSED_CONFIRM_ORDER_CARD' },
    { name: 'Members Invited',     event: 'PRESSED_INVITE_MEMBER_BUTTON' },
    { name: 'Statements Downloaded', event: 'USER_PRESSED_TO_DOWNLOAD_STATEMENTS_AND_IT_COMPLETED' },
    { name: 'New Accounts Opened', event: 'PRESSED_TO_CONFIRM_OPEN_NEW_ACCOUNT' },
    { name: 'Google Wallet Added', event: 'PRESSED_ADD_TO_GOOGLE_WALLET_BUTTON' },
  ],
};
