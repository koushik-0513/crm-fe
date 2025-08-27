// @/types/walkthrough-config.ts

export interface TWalkthroughStep {
  id: string;
  title: string;
  description: string;
  target_selector_id?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center';
  offset?: { x: number; y: number };
  action: 'click' | 'type' | 'none';
  navigation_target?: string;
  zoom_level: number;
}

export enum WalkthroughPage {
  DASHBOARD = 'dashboard',
  CONTACTS = 'contacts',
  ACTIVITIES = 'activities',
  TAGS = 'tags',
  PROFILE = 'profile',
  CHAT = 'chat'
}

/** DASHBOARD STEPS */
export const DASHBOARD_WALKTHROUGH_STEPS: TWalkthroughStep[] = [
  {
    id: 'dashboard-welcome',
    title: 'Welcome to CRM Pro',
    description: 'Welcome to your CRM dashboard! This is your central hub for managing customer relationships and tracking business activities.',
    target_selector_id: 'wt-dashboard-title',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'dashboard-search',
    title: 'Global Search',
    description: 'Use this search bar to quickly find contacts, activities, or any information across your entire CRM.',
    target_selector_id: 'wt-global-search',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'dashboard-user-profile',
    title: 'Your Profile',
    description: 'Access your profile settings and account information by clicking on your profile area. This shows your name, email, and avatar.',
    target_selector_id: 'wt-profile-nav-link',
    position: 'bottom-right',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'dashboard-sidebar',
    title: 'Navigation Menu',
    description: 'Use this sidebar to navigate between different sections of your CRM: Dashboard, Contacts, Activities, Tags, and Chat. The sidebar can be collapsed to save space.',
    target_selector_id: 'wt-sidebar-nav',
    position: 'right',
    offset: { x: 10, y: 0 },
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'dashboard-total-contacts',
    title: 'Total Contacts',
    description: 'This card shows your total number of contacts. The "+1 new this week" indicates recent growth in your contact base.',
    target_selector_id: 'wt-total-contacts-card',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-new-this-week',
    title: 'New Contacts This Week',
    description: 'Track how many new contacts you\'ve added this week. Great for monitoring your outreach efforts!',
    target_selector_id: 'wt-new-contacts-card',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-total-activities',
    title: 'Total Activities',
    description: 'Keep track of all logged activities. This shows you\'ve logged 90 activities total.',
    target_selector_id: 'wt-total-activities-card',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-active-tags',
    title: 'Active Tags',
    description: 'Shows how many tags are currently in use. Tags help you organize and categorize your contacts.',
    target_selector_id: 'wt-active-tags-card',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-contacts-chart',
    title: 'Contacts by Company',
    description: 'This bar chart visualizes your contacts grouped by company. Use this to identify your biggest client relationships.',
    target_selector_id: 'wt-contacts-by-company-chart',
    position: 'right',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-activities-chart',
    title: 'Weekly Activity Tracking',
    description: 'This line chart shows your daily activity patterns. Track your productivity and engagement trends over time.',
    target_selector_id: 'wt-activities-timeline-chart',
    position: 'left',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'dashboard-recent-contacts',
    title: 'Recent Contacts',
    description: 'Quick access to your most recently added or interacted contacts appears here. Perfect for following up on recent conversations.',
    target_selector_id: 'wt-recent-contacts-table',
    position: 'top',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'dashboard-tag-distribution',
    title: 'Tag Distribution',
    description: 'This pie chart shows how your contacts are distributed across different tags. Helps you understand your customer segments.',
    target_selector_id: 'wt-tag-distribution-chart',
    position: 'top',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'dashboard-complete-tour',
    title: 'Completed the dashboard tour',
    description: 'click finish to complete the dashboard tour.',
    target_selector_id: "",
    position: 'right',
    action: 'none',
    zoom_level: 1.02
  }
];

/** CONTACTS STEPS */
export const CONTACTS_WALKTHROUGH_STEPS: TWalkthroughStep[] = [
  {
    id: 'contacts-header',
    title: 'Contacts Management',
    description: 'This is your contact management hub. Here you can view, add, and organize all your customer relationships.',
    target_selector_id: '',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'contacts-add-button',
    title: 'Add New Contact',
    description: 'Click this button to add a new contact to your CRM. You can enter their details and start building the relationship.',
    target_selector_id: 'wt-add-contact-btn',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'contacts-sms-button',
    title: 'SMS Messages',
    description: 'Send bulk SMS messages to your contacts. Great for marketing campaigns or important announcements.',
    target_selector_id: 'wt-sms-contacts-btn',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'contacts-import-csv',
    title: 'Import Contacts',
    description: 'Bulk import contacts from a CSV file. Perfect for migrating from other systems or adding large contact lists.',
    target_selector_id: 'wt-import-csv-btn',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'contacts-search',
    title: 'Search Contacts',
    description: 'Quickly find specific contacts by searching their name, company, or other details.',
    target_selector_id: 'wt-contacts-search-input',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'contacts-view-toggle',
    title: 'View Options',
    description: 'Switch between List and Grid view to see your contacts in different layouts based on your preference.',
    target_selector_id: 'wt-contacts-view-toggle',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'contacts-list',
    title: 'Contact List',
    description: 'Your contacts are displayed here with their details including name, company, email, and phone number.',
    target_selector_id: 'wt-contacts-list-container',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'contacts-actions',
    title: 'Contact Actions',
    description: 'Use these icons to edit contact details or delete contacts. Each contact has its own action menu.',
    target_selector_id: 'wt-contact-actions',
    position: 'top',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'contacts-complete-tour',
    title: 'Completed the contacts tour',
    description: 'click finish to complete the contacts tour.',
    target_selector_id: '',
    position: 'right',
    action: 'none',
    zoom_level: 1.02
  },

];

/** ACTIVITIES STEPS */
export const ACTIVITIES_WALKTHROUGH_STEPS: TWalkthroughStep[] = [
  {
    id: 'activities-header',
    title: 'Activity Timeline',
    description: 'Track all interactions and activities with your contacts. This is your complete activity history.',
    target_selector_id: '',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'activities-filter',
    title: 'Filter Activities',
    description: 'Use filters to narrow down activities by type, contact, or other criteria to find specific interactions.',
    target_selector_id: 'wt-activities-filter',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'activities-date-range',
    title: 'Date Range Selection',
    description: 'Select a specific date range to view activities from a particular time period.',
    target_selector_id: 'wt-activities-date-range',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'activities-clear-filters',
    title: 'Clear Filters',
    description: 'Reset all filters to view all activities again. Useful when you want to see the complete timeline.',
    target_selector_id: 'wt-activities-clear-filters',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'activities-list',
    title: 'Activity List',
    description: 'All your activities are displayed here in chronological order. Each entry shows the contact, type, and details.',
    target_selector_id: 'wt-activities-list-container',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'activities-load-more',
    title: 'Load More Activities',
    description: 'Click here to load more activities if you have a long history. Activities are paginated for better performance.',
    target_selector_id: 'wt-activities-load-more',
    position: 'top',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'activities-complete-tour',
    title: 'Completed the activities tour',
    description: 'click finish to complete the activities tour.',
    target_selector_id: '',
    position: 'right',
    action: 'none',
    zoom_level: 1.02
  }
];

/** TAGS STEPS */
export const TAGS_WALKTHROUGH_STEPS: TWalkthroughStep[] = [
  {
    id: 'tags-header',
    title: 'Tags Management',
    description: 'Organize your contacts with custom tags. Tags help you categorize and segment your customer base.',
    target_selector_id: '',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'tags-add-button',
    title: 'Add New Tags',
    description: 'Create new tags to organize contacts by industry, status, priority, or any custom categories you need.',
    target_selector_id: 'wt-add-tag-btn',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'tags-search',
    title: 'Search Tags',
    description: 'Find specific tags quickly using the search function. Helpful when you have many tags.',
    target_selector_id: 'wt-tags-search-input',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'tags-list',
    title: 'Tag List',
    description: 'All your tags are listed here with their colors and contact counts. You can see how many contacts use each tag.',
    target_selector_id: 'wt-tags-list-container',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'tags-actions',
    title: 'Tag Actions',
    description: 'Edit tag names, colors, or delete tags using these action buttons. Each tag has its own management options.',
    target_selector_id: 'wt-tag-actions',
    position: 'left',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'tags-complete-tour',
    title: 'Completed the tags tour',
    description: 'click finish to complete the tags tour.',
    target_selector_id: '',
    position: 'right',
    action: 'none',
    zoom_level: 1.02
  }
];

/** PROFILE STEPS */
export const PROFILE_WALKTHROUGH_STEPS: TWalkthroughStep[] = [
  {
    id: 'profile-header',
    title: 'Profile Settings',
    description: 'Manage your account information and preferences here. Keep your details up to date.',
    target_selector_id: '',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.02
  },
  {
    id: 'profile-avatar',
    title: 'Profile Picture',
    description: 'Upload or change your profile picture. This appears in the navigation and helps personalize your account.',
    target_selector_id: 'wt-profile-avatar',
    position: 'right',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'profile-contact-info',
    title: 'User Information',
    description: 'Keep your contact information up to date including name, email, and phone number.',
    target_selector_id: 'wt-profile-form',
    position: 'bottom',
    action: 'none',
    zoom_level: 1.03
  },
  {
    id: 'profile-edit-button',
    title: 'Edit Profile',
    description: 'Click here to edit your profile information and save changes.',
    target_selector_id: 'wt-profile-edit-btn',
    position: 'top',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'profile-delete-account',
    title: 'Delete Account',
    description: 'Delete your account permanently. This action cannot be undone, so use with caution.',
    target_selector_id: 'wt-profile-delete-btn',
    position: 'top',
    action: 'none',
    zoom_level: 1.05
  },
  {
    id: 'profile-complete-tour',
    title: 'Completed the profile tour',
    description: 'click finish to complete the profile tour.',
    target_selector_id: '',
    position: 'top',
    action: 'none',
    zoom_level: 1.02
  }
];


/** Helper function to get steps for a specific page */
export function getPageWalkthroughSteps(page: WalkthroughPage): TWalkthroughStep[] {
  switch(page) {
    case 'dashboard':
      return DASHBOARD_WALKTHROUGH_STEPS
    case 'contacts':
      return CONTACTS_WALKTHROUGH_STEPS
    case 'activities':
      return ACTIVITIES_WALKTHROUGH_STEPS
    case 'tags':
      return TAGS_WALKTHROUGH_STEPS
    case 'profile':
      return PROFILE_WALKTHROUGH_STEPS
    default:
      return []
  }
}