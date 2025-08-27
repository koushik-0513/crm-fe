"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, SkipForward } from 'lucide-react'
import { useUserProfile, useUpdateWalkthroughStatus } from '@/hooks/apis/user-service'
import { toast } from 'sonner'
import { 
  getPageWalkthroughSteps, 
  TWalkthroughStep,
  WalkthroughPage
} from '@/types/walkthrough-config'

type TWalkthroughProps = {
  steps: TWalkthroughStep[]
  auto_start: boolean
  className: string
  page_name: string
}

type TWalkthroughState = {
  current_step: number
  is_active: boolean
  target_element: HTMLElement | null
  tooltip_position: { x: number; y: number }
}

export const Walkthrough: React.FC<TWalkthroughProps> = ({
  steps,
  auto_start = false,
  className,
  page_name
}) => {
  const [state, set_state] = useState<TWalkthroughState>({
    current_step: 0,
    is_active: false,
    target_element: null,
    tooltip_position: { x: 0, y: 0 }
  })

  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile()
  const updateWalkthroughMutation = useUpdateWalkthroughStatus()
  
  const tooltip_ref = useRef<HTMLDivElement>(null)

  const findTargetElement = useCallback((target_id: string): HTMLElement | null => {
    try {
      // Return null early if target_id is empty or invalid
      if (!target_id || target_id.trim() === '') {
        console.log('No target ID provided, skipping element search')
        return null
      }
      
      console.log('Looking for element with ID:', target_id)
      
      // First try to find by exact ID
      const element = document.getElementById(target_id)
      if (element) {
        console.log('Found element with ID:', target_id, element)
        return element as HTMLElement
      }
      
      // If not found by ID, try data attribute
      const dataElement = document.querySelector(`[data-walkthrough-id="${target_id}"]`)
      if (dataElement) {
        console.log('Found element with data-walkthrough-id:', target_id, dataElement)
        return dataElement as HTMLElement
      }
      
      // Fallback: try finding by class that contains the ID
      const classElement = document.querySelector(`.${target_id}`)
      if (classElement) {
        console.log('Found element with class:', target_id, classElement)
        return classElement as HTMLElement
      }
      
      console.warn('Could not find element with ID:', target_id)
      console.warn('Make sure to add id="' + target_id + '" to the target element in your HTML')
      
      return null
    } catch (error) {
      console.error('Error finding target element:', error)
      return null
    }
  }, [])

  const highlightElement = useCallback((element: HTMLElement): void => {
    if (!element) return

    // Check if element is in viewport
    const rect = element.getBoundingClientRect()
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    )

    const doHighlight = () => {
      const rect = element.getBoundingClientRect()
      const existingHighlight = document.getElementById('walkthrough-highlight-overlay')
      if (existingHighlight) {
        existingHighlight.remove()
      }
      const highlightOverlay = document.createElement('div')
      highlightOverlay.id = 'walkthrough-highlight-overlay'
      highlightOverlay.style.cssText = `
        position: fixed;
        top: ${rect.top - 4}px;
        left: ${rect.left - 4}px;
        width: ${rect.width + 8}px;
        height: ${rect.height + 8}px;
        border: 3px solid #3b82f6;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        z-index: 9998;
        pointer-events: none;
        animation: walkthrough-pulse 2s infinite;
      `
      document.body.appendChild(highlightOverlay)
      if (!document.getElementById('walkthrough-animation-styles')) {
        const style = document.createElement('style')
        style.id = 'walkthrough-animation-styles'
        style.textContent = `
          @keyframes walkthrough-pulse {
            0%, 100% { 
              border-color: #3b82f6;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.6);
            }
            50% { 
              border-color: #60a5fa;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.8);
            }
          }
        `
        document.head.appendChild(style)
      }
      element.setAttribute('data-walkthrough-highlighted', 'true')
    }

    if (!isInViewport) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(doHighlight, 450)
    } else {
      doHighlight()
    }
  }, [])

  const removeHighlight = useCallback((): void => {
    const highlightOverlay = document.getElementById('walkthrough-highlight-overlay')
    if (highlightOverlay) {
      highlightOverlay.remove()
    }
    
    document.querySelectorAll('[data-walkthrough-highlighted]').forEach(el => {
      el.removeAttribute('data-walkthrough-highlighted')
    })
  }, [])

  const calculateTooltipPosition = useCallback((element: HTMLElement | null, position: string, offset?: { x: number; y: number }): { x: number; y: number } => {
    if (!element) {
      return {
        x: (window.innerWidth / 2) - 160,
        y: (window.innerHeight / 2) - 100
      }
    }

    const rect = element.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 220
    const padding = 20
    
    let x = 0
    let y = 0
    
    switch (position) {
      case 'top':
        x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
        y = rect.top - tooltipHeight - padding
        break
      case 'bottom':
        x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
        y = rect.bottom + padding
        break
      case 'left':
        x = rect.left - tooltipWidth - padding
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        break
      case 'right':
        x = rect.right + padding
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        break
      case 'center':
        x = (window.innerWidth / 2) - (tooltipWidth / 2)
        y = (window.innerHeight / 2) - (tooltipHeight / 2)
        break
      default:
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceLeft = rect.left
        const spaceRight = window.innerWidth - rect.right
        
        if (spaceBelow > tooltipHeight + padding) {
          x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          y = rect.bottom + padding
        } else if (spaceAbove > tooltipHeight + padding) {
          x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          y = rect.top - tooltipHeight - padding
        } else if (spaceRight > tooltipWidth + padding) {
          x = rect.right + padding
          y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        } else if (spaceLeft > tooltipWidth + padding) {
          x = rect.left - tooltipWidth - padding
          y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        } else {
          x = (window.innerWidth / 2) - (tooltipWidth / 2)
          y = (window.innerHeight / 2) - (tooltipHeight / 2)
        }
    }
    
    if (offset) {
      x += offset.x
      y += offset.y
    }
    
    // Ensure tooltip stays within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding))
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding))
    
    return { x, y }
  }, [])

  const start_walkthrough = useCallback((): void => {
    if (steps.length === 0) return
    
    // Check if current page's walkthrough is already completed
    const currentPageWalkthrough = userProfile?.walkthrough?.find(w => w.page_name === page_name)
    if (currentPageWalkthrough?.completed) {
      console.log(`Walkthrough already completed for page: ${page_name}`)
      return
    }
    
    console.log('Starting walkthrough with', steps.length, 'steps')
    set_state(prev => ({ ...prev, is_active: true, current_step: 0 }))
    
    const firstStep = steps[0]
    const element = findTargetElement(firstStep.target_selector_id || '')
    
    if (element) {
      highlightElement(element)
      const tooltipPos = calculateTooltipPosition(element, firstStep.position, firstStep.offset)
      set_state(prev => ({ 
        ...prev, 
        target_element: element,
        tooltip_position: tooltipPos
      }))
    } else {
      console.warn('Could not find element for first step with ID:', firstStep.target_selector_id)
      const tooltipPos = calculateTooltipPosition(null, 'center')
      set_state(prev => ({ 
        ...prev, 
        target_element: null,
        tooltip_position: tooltipPos
      }))
    }
  }, [steps, userProfile, page_name, findTargetElement, highlightElement, calculateTooltipPosition])

  const skip_walkthrough = useCallback(async (page_name: string): Promise<void> => {
    try {
      removeHighlight()
      
      await updateWalkthroughMutation.mutateAsync({ page_name, completed: true })
      await refetchProfile()
      
      set_state(prev => ({ 
        ...prev, 
        is_active: false,
        current_step: 0,
        target_element: null
      }))
      
      toast.success(`This page's walkthrough is completed.`)
    } catch (error) {
      console.error('Failed to skip walkthrough:', error)
      toast.error('Failed to skip walkthrough')
    }
  }, [updateWalkthroughMutation, removeHighlight, refetchProfile])

  const complete_walkthrough = useCallback(async (page_name: string): Promise<void> => {
    console.log("complete_walkthrough called with page_name:", page_name)
    try {
      removeHighlight()
      
      await updateWalkthroughMutation.mutateAsync({ page_name, completed: true })
      await refetchProfile()
      
      set_state(prev => ({ 
        ...prev, 
        is_active: false,
        current_step: 0,
        target_element: null
      }))
      
      // Check if this was the last page to complete
      const allPages = ['dashboard', 'contacts', 'activities', 'tags', 'profile', 'chat']
      const updatedUserProfile = await refetchProfile()
      const allCompleted = allPages.every(page => 
        updatedUserProfile.data?.walkthrough?.find(w => w.page_name === page)?.completed
      )
      
      if (allCompleted) {
        toast.success('All walkthroughs are completed! 🎉')
      } else {
        toast.success(`This page's walkthrough is completed.`)
      }
    } catch (error) {
      console.error('Failed to complete walkthrough:', error)
      toast.error('Failed to complete walkthrough')
    }
  }, [updateWalkthroughMutation, removeHighlight, refetchProfile])


  const skip_all_walkthroughs = useCallback(async (): Promise<void> => {
    try {
      removeHighlight()
  
      const allPages = ['dashboard', 'contacts', 'activities', 'tags', 'profile', 'chat']
      
      // Mark all pages as completed
      const skipPromises = allPages.map(page => 
        updateWalkthroughMutation.mutateAsync({ page_name: page, completed: true })
      )
      
      await Promise.all(skipPromises)
      await refetchProfile()
      
      set_state(prev => ({ 
        ...prev, 
        is_active: false,
        current_step: 0,
        target_element: null
      }))
      
      toast.success('All walkthroughs are completed.')
    } catch (error) {
      console.error('Failed to skip all walkthroughs:', error)
      toast.error('Failed to skip all walkthroughs')
    }
  }, [updateWalkthroughMutation, removeHighlight, refetchProfile])

  const go_to_next_step = useCallback((): void => {
    removeHighlight()
    
    const next_step = state.current_step + 1
    
    if (next_step >= steps.length) {
      complete_walkthrough(page_name)
      return
    }
    
    set_state(prev => ({ ...prev, current_step: next_step }))
    
    const nextStep = steps[next_step]
    const element = findTargetElement(nextStep.target_selector_id || '')
    
    if (element) {
      highlightElement(element)
      const tooltipPos = calculateTooltipPosition(element, nextStep.position, nextStep.offset)
      set_state(prev => ({ 
        ...prev, 
        target_element: element,
        tooltip_position: tooltipPos
      }))
      
      if (nextStep.action === 'click' && nextStep.navigation_target) {
        toast.info(`Click the highlighted element to navigate to ${nextStep.navigation_target}`)
      }
    } else {
      console.warn('Could not find element for step with ID:', nextStep.target_selector_id)
      const tooltipPos = calculateTooltipPosition(null, 'center')
      set_state(prev => ({ 
        ...prev, 
        target_element: null,
        tooltip_position: tooltipPos
      }))
    }
  }, [state.current_step, steps, complete_walkthrough, findTargetElement, highlightElement, removeHighlight, calculateTooltipPosition])

  const go_to_previous_step = useCallback((): void => {
    if (state.current_step === 0) return
    
    removeHighlight()
    
    const prev_step = state.current_step - 1
    set_state(prev => ({ ...prev, current_step: prev_step }))
    
    const prevStep = steps[prev_step]
    const element = findTargetElement(prevStep.target_selector_id || '')
    
    if (element) {
      highlightElement(element)
      const tooltipPos = calculateTooltipPosition(element, prevStep.position, prevStep.offset)
      set_state(prev => ({ 
        ...prev, 
        target_element: element,
        tooltip_position: tooltipPos
      }))
    } else {
      console.warn('Could not find element for previous step with ID:', prevStep.target_selector_id)
      const tooltipPos = calculateTooltipPosition(null, 'center')
      set_state(prev => ({ 
        ...prev, 
        target_element: null,
        tooltip_position: tooltipPos
      }))
    }
  }, [state.current_step, steps, findTargetElement, highlightElement, removeHighlight, calculateTooltipPosition])

  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!state.is_active) return

      switch (e.key) {
        case 'Escape':
          skip_walkthrough(page_name)
          break
        case 'ArrowRight':
          go_to_next_step()
          break
        case 'ArrowLeft':
          go_to_previous_step()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [state.is_active, skip_walkthrough, go_to_next_step, go_to_previous_step, page_name])
  

  useEffect(() => {
    return () => {
      removeHighlight()
      const animationStyles = document.getElementById('walkthrough-animation-styles')
      if (animationStyles) {
        animationStyles.remove()
      }
    }
  }, [removeHighlight])

  useEffect(() => {
    const currentPageWalkthrough = userProfile?.walkthrough?.find(w => w.page_name === page_name)
    if (auto_start && !profileLoading && !currentPageWalkthrough?.completed && steps.length > 0) {
      const timer = setTimeout(() => {
        start_walkthrough()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [auto_start, profileLoading, userProfile, page_name, steps.length, start_walkthrough])

  // Check if current page's walkthrough is completed
  const currentPageWalkthrough = userProfile?.walkthrough?.find(w => w.page_name === page_name)
  if (currentPageWalkthrough?.completed) {
    return null
  }


  const current_step_data = steps[state.current_step]
  const progress_percentage = ((state.current_step + 1) / steps.length) * 100
  
  // Check if current step requires navigation
  const is_navigation_step = current_step_data.action === 'click' && current_step_data.navigation_target

  return (
    <>
      <div
        ref={tooltip_ref}
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-6 max-w-md z-[10000]"
        style={{
          left: `${state.tooltip_position.x}px`,
          top: `${state.tooltip_position.y}px`,
        }}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Step {state.current_step + 1} of {steps.length}</span>
            <span>{Math.round(progress_percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            {current_step_data.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {current_step_data.description}
          </p>
          
        </div>

        <div className="flex items-center justify-between">
          <div className="flex mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip_walkthrough(page_name)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip Page
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skip_all_walkthroughs}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip All
            </Button>
          </div>

          {!is_navigation_step && (
            <div className="flex items-center gap-1">
              {state.current_step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={go_to_previous_step}
                >
                  Back
                </Button>
              )}

                <Button
                  size="sm"
                  onClick={go_to_next_step}
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                >
                  {state.current_step === steps.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const use_page_walkthrough = (page_name: string) => {
  const { data: userProfile, refetch: refetchProfile } = useUserProfile()
  const updateWalkthroughMutation = useUpdateWalkthroughStatus()
  const [is_completed, set_is_completed] = useState<boolean>(false)
  const [current_page_step, set_current_page_step] = useState<number>(0)

  useEffect((): void => {
    
    // Check if ALL page walkthroughs are completed
    const allPages = ['dashboard', 'contacts', 'activities', 'tags', 'profile']
    const allWalkthroughsCompleted = allPages.every(page => 
      userProfile?.walkthrough?.find(w => w.page_name === page)?.completed
    )
    set_is_completed(allWalkthroughsCompleted)
  }, [userProfile, page_name])

  const get_page_steps = useCallback((): TWalkthroughStep[] => {
    return getPageWalkthroughSteps(page_name as WalkthroughPage)
  }, [page_name])

  const reset_page_walkthrough = useCallback(async (): Promise<void> => {
    try {
      set_current_page_step(0)
      await refetchProfile()
    } catch (error) {
      console.error(`Failed to reset ${page_name} walkthrough:`, error)
    }
  }, [page_name, refetchProfile])

  return { 
    is_completed, 
    reset_page_walkthrough, 
    current_page_step,
    set_current_page_step,
    get_page_steps
  }
}

export const use_reset_all_walkthroughs = () => {
  const { data: userProfile, refetch: refetchProfile } = useUserProfile()
  const updateWalkthroughMutation = useUpdateWalkthroughStatus()

  const reset_all_walkthroughs = useCallback(async (): Promise<void> => {
    try {
      // Get all page names from the WalkthroughPage enum
      const allPages = ['dashboard', 'contacts', 'activities', 'tags', 'profile', 'chat']
      
      // Reset each page's walkthrough to not completed
      const resetPromises = allPages.map(page_name => 
        updateWalkthroughMutation.mutateAsync({ page_name, completed: false })
      )
      
      await Promise.all(resetPromises)
      await refetchProfile()
      
      toast.success('All walkthroughs have been reset!')
    } catch (error) {
      console.error('Failed to reset all walkthroughs:', error)
      toast.error('Failed to reset all walkthroughs')
    }
  }, [updateWalkthroughMutation, refetchProfile])

  return { reset_all_walkthroughs }
}