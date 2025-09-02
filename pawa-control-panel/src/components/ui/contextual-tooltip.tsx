import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn('fill-popover', className)}
    {...props}
  />
))
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 max-w-xs overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Enhanced contextual tooltip interfaces
export interface ContextualTooltipProps {
  content: React.ReactNode
  explanation?: React.ReactNode
  learnMoreUrl?: string
  trigger: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delayDuration?: number
  maxWidth?: string
}

const ContextualTooltip = React.forwardRef<
  HTMLDivElement,
  ContextualTooltipProps
>(({ 
  content, 
  explanation, 
  learnMoreUrl, 
  trigger, 
  position = 'top', 
  className,
  delayDuration = 300,
  maxWidth = 'max-w-xs',
  ...props 
}, ref) => {
  const arrowRef = React.useRef(null)
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refs: _refs, floatingStyles, context: _context } = useFloating({
    placement: position,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef })
    ],
    whileElementsMounted: autoUpdate,
  })

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div ref={ref} className={cn('cursor-help', className)} {...props}>
            {trigger}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={position}
          className={cn(maxWidth, 'p-0')}
          style={floatingStyles}
        >
          <div className="p-3 space-y-2">
            <div className="text-sm font-medium leading-relaxed">
              {content}
            </div>
            
            {explanation && (
              <div className="text-xs text-muted-foreground leading-relaxed border-t pt-2">
                {explanation}
              </div>
            )}
            
            {learnMoreUrl && (
              <div className="border-t pt-2">
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Learn more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <TooltipArrow ref={arrowRef} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
ContextualTooltip.displayName = 'ContextualTooltip'

// Helper component for quick metric explanations
export interface MetricTooltipProps {
  metric: string
  definition: string
  businessContext: string
  benchmark?: string
  learnMoreUrl?: string
  trigger: React.ReactNode
}

const MetricTooltip = React.forwardRef<
  HTMLDivElement,
  MetricTooltipProps
>(({ 
  metric, 
  definition, 
  businessContext, 
  benchmark, 
  learnMoreUrl, 
  trigger,
  ...props 
}, ref) => {
  const content = (
    <div className="space-y-2">
      <div className="font-semibold text-sm">{metric}</div>
      <div className="text-xs leading-relaxed">{definition}</div>
    </div>
  )

  const explanation = (
    <div className="space-y-2">
      <div className="text-xs leading-relaxed">
        <span className="font-medium">What this means:</span> {businessContext}
      </div>
      {benchmark && (
        <div className="text-xs leading-relaxed">
          <span className="font-medium">Benchmark:</span> {benchmark}
        </div>
      )}
    </div>
  )

  return (
    <ContextualTooltip
      ref={ref}
      content={content}
      explanation={explanation}
      learnMoreUrl={learnMoreUrl}
      trigger={trigger}
      maxWidth="max-w-sm"
      {...props}
    />
  )
})
MetricTooltip.displayName = 'MetricTooltip'

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
  ContextualTooltip,
  MetricTooltip,
}