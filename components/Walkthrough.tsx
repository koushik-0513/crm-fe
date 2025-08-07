"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, SkipForward } from 'lucide-react'
import { cn } from '@/hooks/utils'
import { useAuth } from '@/contexts/Auth-Context'
import { useUserProfile } from '@/hooks/apis/profile-Service'

type T_WalkthroughStep = {
  id: string
  title: string
  description: string
  target_selector: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  offset?: { x: number; y: number }
}

type T_WalkthroughProps = {
  steps: T_WalkthroughStep[]
  storage_key?: string
  on_complete?: () => void
  on_skip?: () => void
  auto_start?: boolean
  className?: string
  check_new_user?: boolean
}

type T_WalkthroughState = {
  current_step: number
  is_active: boolean
  target_element: HTMLElement | null
  tooltip_position: { x: number; y: number }
}

const WALKTHROUGH_STORAGE_KEY = 'crm_walkthrough_completed'

export const Walkthrough: React.FC<T_WalkthroughProps> = ({
  steps,
  storage_key = WALKTHROUGH_STORAGE_KEY,
  on_complete,
  on_skip,
  auto_start = true,
  className,
  check_new_user = true
}) => {
  const [state, set_state] = useState<T_WalkthroughState>({
    current_step: 0,
    is_active: false,
    target_element: null,
    tooltip_position: { x: 0, y: 0 }
  })

  const { user } = useAuth()
  const { data: userProfile, isLoading: profileLoading } = useUserProfile()
  
  const overlay_ref = useRef<HTMLDivElement>(null)
  const tooltip_ref = useRef<HTMLDivElement>(null)

  const check_walkthrough_status = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    const completed = localStorage.getItem(storage_key)
    return completed === 'true'
  }, [storage_key])

  const is_new_user = useCallback((): boolean => {
    if (!user || !userProfile) return false
    
    // Check if user was created in the last 7 days (new user)
    // This ensures that when a user deletes their account and signs up again,
    // they get a fresh start with no leftover data interfering with the walkthrough
    const user_creation_date = user.metadata?.creationTime
    if (!user_creation_date) return false
    
    const creation_date = new Date(user_creation_date)
    const seven_days_ago = new Date()
    seven_days_ago.setDate(seven_days_ago.getDate() - 7)
    
    const is_new = creation_date > seven_days_ago
    
    return is_new
  }, [user, userProfile])

  const should_show_walkthrough = useCallback((): boolean => {
    if (!check_new_user) return !check_walkthrough_status()
    
    // For new users, show walkthrough regardless of previous completion
    if (is_new_user()) return true
    
    // For existing users, only show if they haven't completed it
    const should_show = !check_walkthrough_status()
    
    return should_show
  }, [check_new_user, check_walkthrough_status, is_new_user])

  const mark_walkthrough_completed = useCallback((): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(storage_key, 'true')
  }, [storage_key])

  const get_target_element = useCallback((selector: string): HTMLElement | null => {
    const element = document.querySelector(selector)
    return element instanceof HTMLElement ? element : null
  }, [])

  const calculate_tooltip_position = useCallback((
    target: HTMLElement,
    position: string = 'bottom',
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ): { x: number; y: number } => {
    const rect = target.getBoundingClientRect()
    const tooltip_width = tooltip_ref.current?.offsetWidth || 300
    const tooltip_height = tooltip_ref.current?.offsetHeight || 150

    let x = rect.left + (rect.width / 2) - (tooltip_width / 2) + offset.x
    let y = rect.top + rect.height + 10 + offset.y

    switch (position) {
      case 'top':
        y = rect.top - tooltip_height - 10 + offset.y
        break
      case 'left':
        x = rect.left - tooltip_width - 10 + offset.x
        y = rect.top + (rect.height / 2) - (tooltip_height / 2) + offset.y
        break
      case 'right':
        x = rect.right + 10 + offset.x
        y = rect.top + (rect.height / 2) - (tooltip_height / 2) + offset.y
        break
      default: // bottom
        y = rect.bottom + 10 + offset.y
        break
    }

    // Ensure tooltip stays within viewport
    const viewport_width = window.innerWidth
    const viewport_height = window.innerHeight

    if (x < 10) x = 10
    if (x + tooltip_width > viewport_width - 10) {
      x = viewport_width - tooltip_width - 10
    }
    if (y < 10) y = 10
    if (y + tooltip_height > viewport_height - 10) {
      y = viewport_height - tooltip_height - 10
    }

    return { x, y }
  }, [])

  const start_walkthrough = useCallback((): void => {
    if (steps.length === 0) return

    // Try to find the target element with multiple attempts
    let target = get_target_element(steps[0].target_selector)
    
    // If not found, try alternative selectors
    if (!target) {
      const alternative_selectors = [
        steps[0].target_selector,
        steps[0].target_selector.replace(/\\:/g, ':'),
        steps[0].target_selector.split(' ')[0],
        // Try simpler selectors
        ...(steps[0].target_selector.includes('grid') ? ['.grid'] : []),
        ...(steps[0].target_selector.includes('button') ? ['button'] : []),
        ...(steps[0].target_selector.includes('h1') ? ['h1'] : []),
        ...(steps[0].target_selector.includes('input') ? ['input'] : []),
        ...(steps[0].target_selector.includes('nav') ? ['nav'] : [])
      ]
      
      for (const selector of alternative_selectors) {
        target = get_target_element(selector)
        if (target) break
      }
    }

    if (!target) {
      console.warn(`Target element not found: ${steps[0].target_selector}`)
      return
    }

    const position = calculate_tooltip_position(
      target,
      steps[0].position,
      steps[0].offset
    )

    set_state(prev => ({
      ...prev,
      is_active: true,
      current_step: 0,
      target_element: target,
      tooltip_position: position
    }))
  }, [steps, get_target_element, calculate_tooltip_position])

  const go_to_next_step = useCallback((): void => {
    const next_step = state.current_step + 1

    if (next_step >= steps.length) {
      complete_walkthrough()
      return
    }

    // Try to find the target element with multiple attempts
    let target = get_target_element(steps[next_step].target_selector)
    
    // If not found, try alternative selectors
    if (!target) {
      const alternative_selectors = [
        steps[next_step].target_selector,
        steps[next_step].target_selector.replace(/\\:/g, ':'),
        steps[next_step].target_selector.split(' ')[0],
        // Try simpler selectors
        ...(steps[next_step].target_selector.includes('grid') ? ['.grid'] : []),
        ...(steps[next_step].target_selector.includes('button') ? ['button'] : []),
        ...(steps[next_step].target_selector.includes('h1') ? ['h1'] : []),
        ...(steps[next_step].target_selector.includes('input') ? ['input'] : []),
        ...(steps[next_step].target_selector.includes('nav') ? ['nav'] : [])
      ]
      
      for (const selector of alternative_selectors) {
        target = get_target_element(selector)
        if (target) break
      }
    }

    if (!target) {
      console.warn(`Target element not found: ${steps[next_step].target_selector}`)
      return
    }

    const position = calculate_tooltip_position(
      target,
      steps[next_step].position,
      steps[next_step].offset
    )

    set_state(prev => ({
      ...prev,
      current_step: next_step,
      target_element: target,
      tooltip_position: position
    }))
  }, [state.current_step, steps, get_target_element, calculate_tooltip_position])

  const complete_walkthrough = useCallback((): void => {
    mark_walkthrough_completed()
    set_state(prev => ({ ...prev, is_active: false }))
    on_complete?.()
  }, [mark_walkthrough_completed, on_complete])

  const skip_walkthrough = useCallback((): void => {
    mark_walkthrough_completed()
    set_state(prev => ({ ...prev, is_active: false }))
    on_skip?.()
  }, [mark_walkthrough_completed, on_skip])

  const handle_overlay_click = useCallback((event: React.MouseEvent): void => {
    if (event.target === overlay_ref.current) {
      go_to_next_step()
    }
  }, [go_to_next_step])

  useEffect(() => {
    // Wait for user profile to load before checking walkthrough status
    if (profileLoading) return
    
    if (auto_start && should_show_walkthrough()) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(start_walkthrough, 100)
      return () => clearTimeout(timer)
    }
  }, [auto_start, should_show_walkthrough, start_walkthrough, profileLoading])

  useEffect(() => {
    if (!state.is_active || !state.target_element) return

    const handle_resize = (): void => {
      const current_step_data = steps[state.current_step]
      
      // Try to find the target element with multiple attempts
      let target = get_target_element(current_step_data.target_selector)
      
      // If not found, try alternative selectors
      if (!target) {
        const alternative_selectors = [
          current_step_data.target_selector,
          current_step_data.target_selector.replace(/\\:/g, ':'),
          current_step_data.target_selector.split(' ')[0],
          // Try simpler selectors
          ...(current_step_data.target_selector.includes('grid') ? ['.grid'] : []),
          ...(current_step_data.target_selector.includes('button') ? ['button'] : []),
          ...(current_step_data.target_selector.includes('h1') ? ['h1'] : []),
          ...(current_step_data.target_selector.includes('input') ? ['input'] : []),
          ...(current_step_data.target_selector.includes('nav') ? ['nav'] : [])
        ]
        
        for (const selector of alternative_selectors) {
          target = get_target_element(selector)
          if (target) break
        }
      }
      
      if (target) {
        const position = calculate_tooltip_position(
          target,
          current_step_data.position,
          current_step_data.offset
        )
        set_state(prev => ({ ...prev, tooltip_position: position }))
      }
    }

    window.addEventListener('resize', handle_resize)
    return () => window.removeEventListener('resize', handle_resize)
  }, [state.is_active, state.current_step, state.target_element, steps, get_target_element, calculate_tooltip_position])

  // Don't render if profile is still loading or user is not authenticated
  if (profileLoading || !user) {
    return null
  }

  if (!state.is_active || steps.length === 0) {
    return null
  }

  const current_step_data = steps[state.current_step]
  const progress_percentage = ((state.current_step + 1) / steps.length) * 100

  return (
    <div
      ref={overlay_ref}
      className={cn(
        "fixed inset-0 z-[9999] bg-black/30",
        className
      )}
      onClick={handle_overlay_click}
    >
      {/* Highlight overlay for target element */}
      {state.target_element && (
        <div
          className="absolute border-2 border-primary/50 bg-primary/10 rounded-md transition-all duration-300"
          style={{
            top: state.target_element.offsetTop - 4,
            left: state.target_element.offsetLeft - 4,
            width: state.target_element.offsetWidth + 8,
            height: state.target_element.offsetHeight + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltip_ref}
        className="absolute bg-background border rounded-lg shadow-lg p-4 max-w-sm"
        style={{
          left: state.tooltip_position.x,
          top: state.tooltip_position.y,
        }}
      >
        {/* Progress indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Step {state.current_step + 1} of {steps.length}</span>
            <span>{Math.round(progress_percentage)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-semibold text-base mb-2">
            {current_step_data.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {current_step_data.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={skip_walkthrough}
            className="text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={go_to_next_step}
            >
              {state.current_step === steps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing walkthrough state
export const use_walkthrough = (storage_key?: string) => {
  const [is_completed, set_is_completed] = useState<boolean>(false)

  useEffect((): void => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(storage_key || WALKTHROUGH_STORAGE_KEY)
    set_is_completed(completed === 'true')
  }, [storage_key])

  const reset_walkthrough = useCallback((): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(storage_key || WALKTHROUGH_STORAGE_KEY)
    set_is_completed(false)
  }, [storage_key])

  return { is_completed, reset_walkthrough }
}

// CRM-specific walkthrough steps
export const CRM_WALKTHROUGH_STEPS: T_WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your CRM',
    description: 'Let\'s take a quick tour of your new CRM dashboard to help you get started.',
    target_selector: 'h1.text-3xl.font-bold',
    position: 'bottom'
  },
  {
    id: 'dashboard-stats',
    title: 'Dashboard Overview',
    description: 'Here you can see key metrics like total contacts, new contacts this week, activities, and active tags.',
    target_selector: '.grid.grid-cols-1',
    position: 'bottom'
  },
  {
    id: 'sidebar-navigation',
    title: 'Navigation Menu',
    description: 'Use the sidebar to navigate between different sections: Dashboard, Contacts, Activities, and Tags.',
    target_selector: 'nav.flex-1.p-4.space-y-2',
    position: 'right',
    offset: { x: 10, y: 0 }
  },
  {
    id: 'contacts-section',
    title: 'Manage Contacts',
    description: 'Click here to view and manage all your contacts. You can add, edit, and organize your contact information.',
    target_selector: 'a[href="/contacts"]',
    position: 'right',
    offset: { x: 10, y: 0 }
  },
  {
    id: 'activities-section',
    title: 'Track Activities',
    description: 'Monitor all activities and interactions with your contacts. Keep track of important events and follow-ups.',
    target_selector: 'a[href="/activities"]',
    position: 'right',
    offset: { x: 10, y: 0 }
  },
  {
    id: 'tags-section',
    title: 'Organize with Tags',
    description: 'Create and manage tags to categorize your contacts. This helps you segment and target your audience effectively.',
    target_selector: 'a[href="/tags"]',
    position: 'right',
    offset: { x: 10, y: 0 }
  },
  {
    id: 'profile-section',
    title: 'Your Profile',
    description: 'Click here to manage your account settings, update your profile information, and configure preferences.',
    target_selector: 'a[href="/profile"]',
    position: 'bottom'
  }
]

// Contacts page specific steps
export const CONTACTS_WALKTHROUGH_STEPS: T_WalkthroughStep[] = [
  {
    id: 'contacts-header',
    title: 'Contacts Management',
    description: 'This is your contacts page where you can view, add, and manage all your customer relationships.',
    target_selector: 'h1',
    position: 'bottom'
  },
  {
    id: 'add-contact-btn',
    title: 'Add New Contact',
    description: 'Click this button to quickly add new contacts to your CRM. You can also import contacts in bulk.',
    target_selector: 'button.bg-gradient-to-r.from-blue-600.to-purple-600',
    position: 'bottom'
  },
  {
    id: 'search-contacts',
    title: 'Search Contacts',
    description: 'Use this search bar to quickly find specific contacts by name, email, company, or other details.',
    target_selector: 'input[placeholder*="Search"]',
    position: 'bottom'
  },
  {
    id: 'view-toggle',
    title: 'View Options',
    description: 'Switch between list and grid views to see your contacts in different layouts.',
    target_selector: '.flex.border.rounded-lg.overflow-hidden',
    position: 'bottom'
  },
  {
    id: 'import-csv',
    title: 'Import Contacts',
    description: 'Bulk import contacts from a CSV file. This is perfect for migrating data from other systems.',
    target_selector: 'button.variant-outline',
    position: 'bottom'
  },
  {
    id: 'contacts-list',
    title: 'Contacts List',
    description: 'View all your contacts here. Click on any contact to see detailed information and edit their details.',
    target_selector: '.grid.grid-cols-1',
    position: 'top'
  }
]

// Activities page specific steps
export const ACTIVITIES_WALKTHROUGH_STEPS: T_WalkthroughStep[] = [
  {
    id: 'activities-header',
    title: 'Activity Log',
    description: 'This page shows all activities and interactions with your contacts. Track important events and follow-ups.',
    target_selector: 'h1',
    position: 'bottom'
  },
  {
    id: 'activity-filters',
    title: 'Filter Activities',
    description: 'Use these filters to find specific activities by type, date, or contact.',
    target_selector: '.flex.flex-col.sm\\:flex-row.gap-4',
    position: 'bottom'
  },
  {
    id: 'activity-list',
    title: 'Activity Timeline',
    description: 'View all your activities in chronological order. Click on any activity for more details.',
    target_selector: '.space-y-3',
    position: 'top'
  }
]

// Tags page specific steps
export const TAGS_WALKTHROUGH_STEPS: T_WalkthroughStep[] = [
  {
    id: 'tags-header',
    title: 'Tag Management',
    description: 'Create and manage tags to organize your contacts. Tags help you categorize and segment your audience.',
    target_selector: 'h1',
    position: 'bottom'
  },
  {
    id: 'create-tag-btn',
    title: 'Create New Tag',
    description: 'Click here to create a new tag. You can choose a color and name for your tag.',
    target_selector: 'button.bg-gradient-to-r.from-blue-600.to-purple-600',
    position: 'bottom'
  },
  {
    id: 'tags-grid',
    title: 'Your Tags',
    description: 'View all your created tags here. Click on any tag to edit or delete it.',
    target_selector: '.grid.grid-cols-1',
    position: 'top'
  }
] 