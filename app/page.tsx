'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { callAIAgent, type AIAgentResponse } from '@/lib/aiAgent'
import { FiCalendar, FiShoppingCart, FiSettings, FiRefreshCw, FiClock, FiChevronDown, FiChevronUp, FiPrinter, FiCopy, FiCheck, FiX, FiPlus, FiInfo, FiBookmark, FiList, FiHeart } from 'react-icons/fi'
import { LuFlame, LuSalad, LuChefHat, LuTimer, LuDollarSign, LuUtensilsCrossed, LuVegan, LuLeafyGreen } from 'react-icons/lu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

// ─── Constants ───────────────────────────────────────────────────────────────

const AGENT_ID = '699959c4711ecaca449d0655'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const
const CUISINE_OPTIONS = ['Indian', 'Mediterranean', 'Asian', 'Mexican', 'American', 'Italian', 'Thai', 'Japanese'] as const
const BUDGET_OPTIONS = ['Low', 'Medium'] as const

const SHOPPING_CATEGORIES: { key: string; label: string }[] = [
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Fruits' },
  { key: 'grains', label: 'Grains' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'legumes', label: 'Legumes' },
  { key: 'spices', label: 'Spices' },
  { key: 'oils_and_condiments', label: 'Oils & Condiments' },
  { key: 'other', label: 'Other' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface MealSlotOverview {
  name?: string
  prepTime?: string
  calories?: number
}

interface Ingredient {
  item?: string
  quantity?: string
  estimatedCost?: number
}

interface NutritionInfo {
  calories?: number
  protein?: string | number
  fiber?: string | number
  iron?: string | number
  carbs?: string | number
  fat?: string | number
}

interface MealDetail {
  slot?: string
  name?: string
  prepTime?: string
  cookTime?: string
  servings?: number | string
  ingredients?: Ingredient[]
  instructions?: string[]
  nutrition?: NutritionInfo
  equipmentNeeded?: string[]
  tips?: string
}

interface DayDetailEntry {
  meals?: MealDetail[]
}

interface ShoppingItem {
  item?: string
  quantity?: string
  estimatedCost?: number
}

interface WeekSummary {
  avgCaloriesPerDay?: number
  topNutrients?: string[]
  cuisinesCovered?: string[]
  budgetRating?: string
}

interface MealPlanData {
  weeklyOverview?: Record<string, Record<string, MealSlotOverview>>
  dayDetails?: Record<string, DayDetailEntry>
  shoppingList?: Record<string, ShoppingItem[]>
  totalEstimatedCost?: number
  weekSummary?: WeekSummary
}

interface SavedPlan {
  id: string
  date: string
  budget: string
  cuisines: string[]
  data: MealPlanData
}

interface UserSettings {
  budget: string
  meals: string[]
  cuisines: string[]
  healthGoals: string[]
  equipmentExclusions: string[]
  allergies: string
  height: string
  weight: string
  age: string
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

function getSampleData(): MealPlanData {
  return {
    weeklyOverview: {
      monday: { breakfast: { name: 'Masala Oats', prepTime: '10 min', calories: 310 }, lunch: { name: 'Rajma Chawal', prepTime: '25 min', calories: 520 }, dinner: { name: 'Palak Paneer', prepTime: '30 min', calories: 450 } },
      tuesday: { breakfast: { name: 'Smoothie Bowl', prepTime: '8 min', calories: 290 }, lunch: { name: 'Falafel Wrap', prepTime: '20 min', calories: 480 }, dinner: { name: 'Pasta Primavera', prepTime: '25 min', calories: 410 } },
      wednesday: { breakfast: { name: 'Avocado Toast', prepTime: '7 min', calories: 340 }, lunch: { name: 'Buddha Bowl', prepTime: '15 min', calories: 490 }, dinner: { name: 'Chana Masala', prepTime: '30 min', calories: 430 } },
      thursday: { breakfast: { name: 'Overnight Oats', prepTime: '5 min', calories: 320 }, lunch: { name: 'Veggie Burrito', prepTime: '15 min', calories: 530 }, dinner: { name: 'Stir Fry Tofu', prepTime: '20 min', calories: 390 } },
      friday: { breakfast: { name: 'Poha', prepTime: '12 min', calories: 280 }, lunch: { name: 'Greek Salad', prepTime: '10 min', calories: 350 }, dinner: { name: 'Mushroom Risotto', prepTime: '35 min', calories: 460 } },
      saturday: { breakfast: { name: 'Pancakes', prepTime: '15 min', calories: 380 }, lunch: { name: 'Pad Thai', prepTime: '25 min', calories: 510 }, dinner: { name: 'Stuffed Peppers', prepTime: '40 min', calories: 420 } },
      sunday: { breakfast: { name: 'Idli Sambar', prepTime: '20 min', calories: 310 }, lunch: { name: 'Veggie Pizza', prepTime: '30 min', calories: 560 }, dinner: { name: 'Dal Makhani', prepTime: '35 min', calories: 470 } },
    },
    dayDetails: {
      monday: {
        meals: [
          { slot: 'Breakfast', name: 'Masala Oats', prepTime: '5 min', cookTime: '10 min', servings: 2, ingredients: [{ item: 'Rolled Oats', quantity: '1 cup', estimatedCost: 0.50 }, { item: 'Onion', quantity: '1 medium', estimatedCost: 0.30 }, { item: 'Tomato', quantity: '1 medium', estimatedCost: 0.40 }, { item: 'Green Peas', quantity: '1/4 cup', estimatedCost: 0.35 }, { item: 'Spice Mix', quantity: '1 tsp', estimatedCost: 0.10 }], instructions: ['Heat oil in a pan and saute onions until golden.', 'Add tomatoes, green peas, and spice mix. Cook 3 minutes.', 'Add oats and 2 cups water. Stir well.', 'Cook on medium heat for 5-7 minutes until thick.', 'Garnish with cilantro and serve hot.'], nutrition: { calories: 310, protein: '12g', fiber: '6g', iron: '15%', carbs: '48g', fat: '8g' }, equipmentNeeded: ['Saucepan', 'Spatula'], tips: 'Add a squeeze of lemon for extra flavor.' },
          { slot: 'Lunch', name: 'Rajma Chawal', prepTime: '15 min', cookTime: '25 min', servings: 2, ingredients: [{ item: 'Kidney Beans', quantity: '1 cup', estimatedCost: 0.80 }, { item: 'Basmati Rice', quantity: '1 cup', estimatedCost: 0.60 }, { item: 'Onion', quantity: '1 large', estimatedCost: 0.30 }, { item: 'Tomato Puree', quantity: '1/2 cup', estimatedCost: 0.50 }, { item: 'Ginger Garlic Paste', quantity: '1 tbsp', estimatedCost: 0.20 }], instructions: ['Soak kidney beans overnight and pressure cook until soft.', 'Saute onions, add ginger garlic paste.', 'Add tomato puree and spices, cook 5 minutes.', 'Add cooked beans and simmer 15 minutes.', 'Serve over steamed basmati rice.'], nutrition: { calories: 520, protein: '18g', fiber: '12g', iron: '22%', carbs: '82g', fat: '10g' }, equipmentNeeded: ['Pressure Cooker', 'Pan'], tips: 'Mash a few beans for a creamier gravy.' },
          { slot: 'Dinner', name: 'Palak Paneer', prepTime: '15 min', cookTime: '30 min', servings: 2, ingredients: [{ item: 'Spinach', quantity: '2 bunches', estimatedCost: 1.20 }, { item: 'Paneer', quantity: '200g', estimatedCost: 2.50 }, { item: 'Onion', quantity: '1 medium', estimatedCost: 0.30 }, { item: 'Cream', quantity: '2 tbsp', estimatedCost: 0.40 }], instructions: ['Blanch spinach and blend into a smooth puree.', 'Saute onions with ginger garlic paste.', 'Add spinach puree and cook 5 minutes.', 'Add paneer cubes and cream, simmer 10 minutes.', 'Season with salt and garam masala. Serve with roti.'], nutrition: { calories: 450, protein: '22g', fiber: '8g', iron: '30%', carbs: '25g', fat: '28g' }, equipmentNeeded: ['Blender', 'Pan'], tips: 'Use fresh spinach for the best color and taste.' },
        ],
      },
      tuesday: {
        meals: [
          { slot: 'Breakfast', name: 'Smoothie Bowl', prepTime: '5 min', cookTime: '3 min', servings: 1, ingredients: [{ item: 'Banana', quantity: '1 large', estimatedCost: 0.25 }, { item: 'Mixed Berries', quantity: '1/2 cup', estimatedCost: 1.50 }, { item: 'Granola', quantity: '1/4 cup', estimatedCost: 0.60 }, { item: 'Yogurt', quantity: '1/2 cup', estimatedCost: 0.40 }], instructions: ['Blend banana, berries, and yogurt until smooth.', 'Pour into a bowl.', 'Top with granola, sliced fruits, and honey.'], nutrition: { calories: 290, protein: '8g', fiber: '5g', iron: '8%', carbs: '52g', fat: '6g' }, equipmentNeeded: ['Blender'], tips: 'Freeze the banana overnight for a thicker consistency.' },
        ],
      },
    },
    shoppingList: {
      vegetables: [{ item: 'Spinach', quantity: '4 bunches', estimatedCost: 2.40 }, { item: 'Onions', quantity: '2 lbs', estimatedCost: 1.50 }, { item: 'Tomatoes', quantity: '2 lbs', estimatedCost: 2.00 }, { item: 'Bell Peppers', quantity: '4 pieces', estimatedCost: 3.00 }],
      fruits: [{ item: 'Bananas', quantity: '1 bunch', estimatedCost: 1.20 }, { item: 'Mixed Berries', quantity: '2 cups', estimatedCost: 4.00 }, { item: 'Avocados', quantity: '3 pieces', estimatedCost: 3.50 }],
      grains: [{ item: 'Basmati Rice', quantity: '2 lbs', estimatedCost: 3.00 }, { item: 'Rolled Oats', quantity: '1 lb', estimatedCost: 2.50 }, { item: 'Whole Wheat Flour', quantity: '2 lbs', estimatedCost: 2.00 }],
      dairy: [{ item: 'Paneer', quantity: '400g', estimatedCost: 5.00 }, { item: 'Yogurt', quantity: '32 oz', estimatedCost: 3.50 }, { item: 'Cream', quantity: '1 cup', estimatedCost: 1.50 }],
      legumes: [{ item: 'Kidney Beans', quantity: '1 lb', estimatedCost: 1.80 }, { item: 'Chickpeas', quantity: '1 lb', estimatedCost: 1.50 }, { item: 'Lentils', quantity: '1 lb', estimatedCost: 1.40 }],
      spices: [{ item: 'Garam Masala', quantity: '50g', estimatedCost: 2.00 }, { item: 'Turmeric', quantity: '50g', estimatedCost: 1.50 }, { item: 'Cumin Seeds', quantity: '50g', estimatedCost: 1.00 }],
      oils_and_condiments: [{ item: 'Olive Oil', quantity: '500ml', estimatedCost: 4.50 }, { item: 'Soy Sauce', quantity: '200ml', estimatedCost: 2.00 }],
      other: [{ item: 'Tofu', quantity: '2 blocks', estimatedCost: 4.00 }, { item: 'Granola', quantity: '1 lb', estimatedCost: 3.50 }],
    },
    totalEstimatedCost: 62.75,
    weekSummary: {
      avgCaloriesPerDay: 1680,
      topNutrients: ['Iron', 'Fiber', 'Protein', 'Vitamin C'],
      cuisinesCovered: ['Indian', 'Mediterranean', 'Asian', 'Mexican', 'Italian'],
      budgetRating: 'Budget-Friendly',
    },
  }
}

// ─── ErrorBoundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Markdown renderer ──────────────────────────────────────────────────────

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (<strong key={i} className="font-semibold">{part}</strong>) : (part)
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ─── Helper: parse agent response ────────────────────────────────────────────

// ─── Safe agent call wrapper ─────────────────────────────────────────────────
// Wraps callAIAgent to prevent fetchWrapper's confirm/alert dialogs from
// breaking the UI by catching all errors gracefully.
async function safeCallAgent(message: string, agentId: string): Promise<AIAgentResponse> {
  try {
    const result = await callAIAgent(message, agentId)
    return result
  } catch (err) {
    return {
      success: false,
      response: {
        status: 'error' as const,
        result: {},
        message: err instanceof Error ? err.message : 'Network error - please try again',
      },
      error: err instanceof Error ? err.message : 'Network error - please try again',
    }
  }
}

function tryParseJSON(value: any): any {
  if (!value) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return value }
  }
  return value
}

function parseAgentResponse(result: any): MealPlanData | null {
  if (!result) return null

  // Try various paths to get to the actual data
  let data: any = null

  // Path 1: Standard success response
  if (result?.success && result?.response?.result) {
    data = tryParseJSON(result.response.result)
  }

  // Path 2: Direct response.result
  if (!data && result?.response?.result) {
    data = tryParseJSON(result.response.result)
  }

  // Path 3: Raw response string
  if (!data && result?.raw_response) {
    data = tryParseJSON(result.raw_response)
  }

  // Path 4: Response message as JSON
  if (!data && result?.response?.message) {
    data = tryParseJSON(result.response.message)
  }

  // Unwrap nested result objects
  if (data && typeof data === 'object') {
    if ('result' in data && data.result) {
      data = tryParseJSON(data.result)
    }
    if ('response' in data && data.response && !('weeklyOverview' in data)) {
      data = tryParseJSON(data.response)
    }
  }

  // Final validation: must be an object with at least one expected key
  if (!data || typeof data !== 'object') return null
  if (!data.weeklyOverview && !data.dayDetails && !data.shoppingList) return null

  return data as MealPlanData
}

// ─── Sidebar Component ──────────────────────────────────────────────────────

function Sidebar({ activeScreen, onNavigate }: { activeScreen: string; onNavigate: (s: string) => void }) {
  const navItems = [
    { id: 'planner', label: 'Planner', icon: FiCalendar },
    { id: 'saved', label: 'Saved Plans', icon: FiBookmark },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ]

  return (
    <div className="w-[220px] min-h-screen flex-shrink-0 bg-white/60 backdrop-blur-[16px] border-r border-white/[0.18] flex flex-col">
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <LuLeafyGreen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">VegFit</span>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeScreen === item.id
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-4 mx-3 mb-4 rounded-xl bg-secondary/60 border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <LuVegan className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">100% Plant-Powered</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">AI-crafted vegetarian meals for better energy and health.</p>
      </div>
    </div>
  )
}

// ─── Preferences Panel ──────────────────────────────────────────────────────

function PreferencesPanel({
  collapsed,
  onToggle,
  budget,
  setBudget,
  selectedMeals,
  setSelectedMeals,
  selectedCuisines,
  setSelectedCuisines,
  healthGoals,
  setHealthGoals,
  equipmentExclusions,
  setEquipmentExclusions,
  allergies,
  setAllergies,
  newExclusion,
  setNewExclusion,
}: {
  collapsed: boolean
  onToggle: () => void
  budget: string
  setBudget: (v: string) => void
  selectedMeals: string[]
  setSelectedMeals: (v: string[]) => void
  selectedCuisines: string[]
  setSelectedCuisines: (v: string[]) => void
  healthGoals: string[]
  setHealthGoals: (v: string[]) => void
  equipmentExclusions: string[]
  setEquipmentExclusions: (v: string[]) => void
  allergies: string
  setAllergies: (v: string) => void
  newExclusion: string
  setNewExclusion: (v: string) => void
}) {
  const toggleMeal = (meal: string) => {
    setSelectedMeals(selectedMeals.includes(meal) ? selectedMeals.filter(m => m !== meal) : [...selectedMeals, meal])
  }
  const toggleCuisine = (c: string) => {
    setSelectedCuisines(selectedCuisines.includes(c) ? selectedCuisines.filter(x => x !== c) : [...selectedCuisines, c])
  }
  const toggleGoal = (g: string) => {
    setHealthGoals(healthGoals.includes(g) ? healthGoals.filter(x => x !== g) : [...healthGoals, g])
  }
  const addExclusion = () => {
    if (newExclusion.trim() && !equipmentExclusions.includes(newExclusion.trim())) {
      setEquipmentExclusions([...equipmentExclusions, newExclusion.trim()])
      setNewExclusion('')
    }
  }
  const removeExclusion = (e: string) => {
    setEquipmentExclusions(equipmentExclusions.filter(x => x !== e))
  }

  return (
    <div className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <FiSettings className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Meal Preferences</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Vegetarian</Badge>
          {collapsed ? <FiChevronDown className="w-4 h-4 text-muted-foreground" /> : <FiChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/40">
          <div className="pt-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Diet Type</Label>
            <Badge className="bg-primary text-primary-foreground">Vegetarian</Badge>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Equipment Exclusions</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {equipmentExclusions.map((e) => (
                <span key={e} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                  {e}
                  <button onClick={() => removeExclusion(e)} className="hover:text-destructive"><FiX className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="e.g. No Microwave" value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addExclusion() }} className="h-8 text-xs rounded-lg" />
              <button onClick={addExclusion} className="px-3 h-8 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1">
                <FiPlus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Health Goals</Label>
            <div className="flex flex-wrap gap-2">
              {['Better Energy', 'General Nutrition', 'Weight Loss', 'Muscle Building'].map((goal) => (
                <button key={goal} onClick={() => toggleGoal(goal)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${healthGoals.includes(goal) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Budget Range</Label>
            <div className="flex gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <button key={b} onClick={() => setBudget(b)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${budget === b ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <LuDollarSign className="w-3 h-3 inline mr-1" />{b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Meals Per Day</Label>
            <div className="flex flex-wrap gap-3">
              {MEAL_SLOTS.map((meal) => (
                <label key={meal} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={selectedMeals.includes(meal)} onCheckedChange={() => toggleMeal(meal)} />
                  <span className="text-xs font-medium text-foreground">{meal}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Cuisine Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => (
                <button key={c} onClick={() => toggleCuisine(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${selectedCuisines.includes(c) ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Allergies / Dislikes</Label>
            <Input placeholder="e.g. mushrooms, eggplant..." value={allergies} onChange={(e) => setAllergies(e.target.value)} className="rounded-lg text-sm" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Weekly Overview Tab ─────────────────────────────────────────────────────

function WeeklyOverviewTab({ data }: { data: MealPlanData }) {
  const overview = data?.weeklyOverview
  const summary = data?.weekSummary

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex flex-wrap gap-3">
          {summary.avgCaloriesPerDay != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/75 backdrop-blur-[16px] border border-white/[0.18]">
              <LuFlame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-foreground">{summary.avgCaloriesPerDay} avg cal/day</span>
            </div>
          )}
          {summary.budgetRating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/75 backdrop-blur-[16px] border border-white/[0.18]">
              <LuDollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">{summary.budgetRating}</span>
            </div>
          )}
          {Array.isArray(summary?.cuisinesCovered) && summary.cuisinesCovered.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/75 backdrop-blur-[16px] border border-white/[0.18]">
              <LuUtensilsCrossed className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-foreground">{summary.cuisinesCovered.join(', ')}</span>
            </div>
          )}
          {Array.isArray(summary?.topNutrients) && summary.topNutrients.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/75 backdrop-blur-[16px] border border-white/[0.18]">
              <FiHeart className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-foreground">Top: {summary.topNutrients.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DAYS.map((day) => {
          const dayData = overview?.[day]
          if (!dayData) return (
            <div key={day} className="bg-white/60 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-3">
              <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{DAY_LABELS[day]}</h3>
              <p className="text-xs text-muted-foreground">No meals planned</p>
            </div>
          )
          const slots = Object.entries(dayData)
          return (
            <div key={day} className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-3 space-y-2">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">{DAY_LABELS[day]}</h3>
              {slots.map(([slot, meal]) => {
                const m = meal as MealSlotOverview
                return (
                  <div key={slot} className="p-2 rounded-lg bg-secondary/40 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{slot}</p>
                    <p className="text-xs font-medium text-foreground leading-snug">{m?.name ?? 'Unnamed'}</p>
                    <div className="flex items-center gap-2">
                      {m?.prepTime && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <FiClock className="w-2.5 h-2.5" /> {m.prepTime}
                        </span>
                      )}
                      {m?.calories != null && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <LuFlame className="w-2.5 h-2.5" /> {m.calories}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day Detail Card ─────────────────────────────────────────────────────────

function DayDetailCard({ day, detail, onRegenerate, regenerating }: { day: string; detail: DayDetailEntry | undefined; onRegenerate: (day: string) => void; regenerating: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const meals = Array.isArray(detail?.meals) ? detail.meals : []

  return (
    <div className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiCalendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground">{DAY_LABELS[day] ?? day}</h3>
            <p className="text-xs text-muted-foreground">{meals.length} meal{meals.length !== 1 ? 's' : ''} planned</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meals.length > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {meals.map(m => m?.name).filter(Boolean).join(' / ')}
            </span>
          )}
          {expanded ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
          {meals.map((meal, idx) => (
            <MealCard key={idx} meal={meal} />
          ))}
          {meals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No detailed meals available for this day.</p>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => onRegenerate(day)} disabled={regenerating} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
              <FiRefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate This Day'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Meal Card ───────────────────────────────────────────────────────────────

function MealCard({ meal }: { meal: MealDetail }) {
  const [showInstructions, setShowInstructions] = useState(false)
  const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients : []
  const instructions = Array.isArray(meal?.instructions) ? meal.instructions : []
  const equipment = Array.isArray(meal?.equipmentNeeded) ? meal.equipmentNeeded : []

  return (
    <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="outline" className="text-[10px] mb-1.5 border-primary/30 text-primary">{meal?.slot ?? 'Meal'}</Badge>
          <h4 className="text-sm font-semibold text-foreground">{meal?.name ?? 'Unnamed Meal'}</h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {meal?.prepTime && <span className="flex items-center gap-1"><LuTimer className="w-3 h-3" /> Prep: {meal.prepTime}</span>}
          {meal?.cookTime && <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> Cook: {meal.cookTime}</span>}
          {meal?.servings && <span className="flex items-center gap-1"><LuUtensilsCrossed className="w-3 h-3" /> {meal.servings} srv</span>}
        </div>
      </div>

      {meal?.nutrition && (
        <div className="flex flex-wrap gap-2">
          {meal.nutrition.calories != null && <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[10px] font-semibold flex items-center gap-1"><LuFlame className="w-2.5 h-2.5" />{meal.nutrition.calories} cal</span>}
          {meal.nutrition.protein != null && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">{meal.nutrition.protein} protein</span>}
          {meal.nutrition.fiber != null && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-semibold">{meal.nutrition.fiber} fiber</span>}
          {meal.nutrition.iron != null && <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-semibold">{meal.nutrition.iron} iron</span>}
          {meal.nutrition.carbs != null && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold">{meal.nutrition.carbs} carbs</span>}
          {meal.nutrition.fat != null && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold">{meal.nutrition.fat} fat</span>}
        </div>
      )}

      {ingredients.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ingredients</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-foreground px-2 py-1 rounded bg-white/50">
                <span>{ing?.item ?? 'Item'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{ing?.quantity ?? ''}</span>
                  {ing?.estimatedCost != null && <span className="text-primary font-medium">${Number(ing.estimatedCost).toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {instructions.length > 0 && (
        <div>
          <button onClick={() => setShowInstructions(!showInstructions)} className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5 hover:text-primary/80 transition-colors">
            <LuChefHat className="w-3 h-3" />
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            {showInstructions ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
          </button>
          {showInstructions && (
            <ol className="space-y-1.5 pl-1">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5">{typeof step === 'string' ? step : JSON.stringify(step)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {equipment.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Equipment:</span>
          {equipment.map((eq, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">{typeof eq === 'string' ? eq : JSON.stringify(eq)}</span>
          ))}
        </div>
      )}

      {meal?.tips && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <FiInfo className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground">{meal.tips}</p>
        </div>
      )}
    </div>
  )
}

// ─── Day by Day Tab ──────────────────────────────────────────────────────────

function DayByDayTab({ data, onRegenerateDay, regeneratingDay }: { data: MealPlanData; onRegenerateDay: (day: string) => void; regeneratingDay: string | null }) {
  const dayDetails = data?.dayDetails
  return (
    <div className="space-y-3">
      {DAYS.map((day) => (
        <DayDetailCard key={day} day={day} detail={dayDetails?.[day]} onRegenerate={onRegenerateDay} regenerating={regeneratingDay === day} />
      ))}
    </div>
  )
}

// ─── Shopping List Tab ───────────────────────────────────────────────────────

function ShoppingListTab({ data }: { data: MealPlanData }) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const shoppingList = data?.shoppingList
  const totalCost = data?.totalEstimatedCost

  const toggleItem = useCallback((key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const allItems = useMemo(() => {
    if (!shoppingList) return []
    const items: string[] = []
    SHOPPING_CATEGORIES.forEach(({ key, label }) => {
      const catItems = shoppingList[key]
      if (Array.isArray(catItems) && catItems.length > 0) {
        items.push(`\n--- ${label} ---`)
        catItems.forEach((it) => {
          items.push(`${it?.item ?? 'Item'} - ${it?.quantity ?? ''} ($${Number(it?.estimatedCost ?? 0).toFixed(2)})`)
        })
      }
    })
    if (totalCost != null) {
      items.push(`\n=== Total Estimated Cost: $${Number(totalCost).toFixed(2)} ===`)
    }
    return items
  }, [shoppingList, totalCost])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(allItems.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }, [allItems])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalItemCount = useMemo(() => {
    if (!shoppingList) return 0
    let count = 0
    SHOPPING_CATEGORIES.forEach(({ key }) => {
      const catItems = shoppingList[key]
      if (Array.isArray(catItems)) count += catItems.length
    })
    return count
  }, [shoppingList])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {totalCost != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground">
              <LuDollarSign className="w-4 h-4" />
              <span className="text-sm font-semibold">Total: ${Number(totalCost).toFixed(2)}</span>
            </div>
          )}
          {totalItemCount > 0 && (
            <span className="text-xs text-muted-foreground">{checkedCount}/{totalItemCount} items checked</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            <FiPrinter className="w-3 h-3" /> Print
          </button>
        </div>
      </div>

      {totalItemCount > 0 && (
        <Progress value={(checkedCount / totalItemCount) * 100} className="h-2" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOPPING_CATEGORIES.map(({ key, label }) => {
          const items = shoppingList?.[key]
          if (!Array.isArray(items) || items.length === 0) return null
          return (
            <div key={key} className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-4">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <LuSalad className="w-3.5 h-3.5" /> {label}
              </h4>
              <div className="space-y-1.5">
                {items.map((it, i) => {
                  const itemKey = `${key}-${i}`
                  const isChecked = checkedItems[itemKey] === true
                  return (
                    <label key={i} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-secondary/30'}`}>
                      <Checkbox checked={isChecked} onCheckedChange={() => toggleItem(itemKey)} />
                      <span className={`flex-1 text-xs font-medium ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{it?.item ?? 'Item'}</span>
                      <span className="text-xs text-muted-foreground">{it?.quantity ?? ''}</span>
                      {it?.estimatedCost != null && <span className="text-xs font-medium text-primary">${Number(it.estimatedCost).toFixed(2)}</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Saved Plans Screen ──────────────────────────────────────────────────────

function SavedPlansScreen({ onLoadPlan }: { onLoadPlan: (plan: SavedPlan) => void }) {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vegfit_saved_plans')
      if (stored) setSavedPlans(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const deletePlan = (id: string) => {
    const updated = savedPlans.filter(p => p.id !== id)
    setSavedPlans(updated)
    localStorage.setItem('vegfit_saved_plans', JSON.stringify(updated))
  }

  if (savedPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
          <FiBookmark className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No saved plans yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">Generate your first meal plan to get started! Your plans will be saved here for easy access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Saved Meal Plans</h2>
      <div className="space-y-3">
        {savedPlans.map((plan) => (
          <div key={plan.id} className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{plan.date}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]"><LuDollarSign className="w-2.5 h-2.5 mr-0.5" />{plan.budget}</Badge>
                  {Array.isArray(plan?.cuisines) && plan.cuisines.slice(0, 3).map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onLoadPlan(plan)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">View</button>
              <button onClick={() => deletePlan(plan.id)} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"><FiX className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Screen ─────────────────────────────────────────────────────────

function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    budget: 'Medium',
    meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
    cuisines: ['Indian', 'Mediterranean'],
    healthGoals: ['Better Energy', 'General Nutrition'],
    equipmentExclusions: ['No Air Fryer'],
    allergies: '',
    height: '',
    weight: '',
    age: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vegfit_settings')
      if (stored) setSettings(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('vegfit_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleMeal = (meal: string) => {
    setSettings(prev => ({
      ...prev,
      meals: prev.meals.includes(meal) ? prev.meals.filter(m => m !== meal) : [...prev.meals, meal]
    }))
  }
  const toggleCuisine = (c: string) => {
    setSettings(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c) ? prev.cuisines.filter(x => x !== c) : [...prev.cuisines, c]
    }))
  }
  const toggleGoal = (g: string) => {
    setSettings(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(g) ? prev.healthGoals.filter(x => x !== g) : [...prev.healthGoals, g]
    }))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Default Preferences</h2>

      <div className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-5 space-y-5">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Budget Range</Label>
          <div className="flex gap-2">
            {BUDGET_OPTIONS.map((b) => (
              <button key={b} onClick={() => setSettings(prev => ({ ...prev, budget: b }))} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${settings.budget === b ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Meals Per Day</Label>
          <div className="flex flex-wrap gap-3">
            {MEAL_SLOTS.map((meal) => (
              <label key={meal} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={settings.meals.includes(meal)} onCheckedChange={() => toggleMeal(meal)} />
                <span className="text-xs font-medium">{meal}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Cuisine Preferences</Label>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${settings.cuisines.includes(c) ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Health Goals</Label>
          <div className="flex flex-wrap gap-2">
            {['Better Energy', 'General Nutrition', 'Weight Loss', 'Muscle Building'].map((goal) => (
              <button key={goal} onClick={() => toggleGoal(goal)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${settings.healthGoals.includes(goal) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Allergies / Dislikes</Label>
          <Input placeholder="e.g. mushrooms, eggplant..." value={settings.allergies} onChange={(e) => setSettings(prev => ({ ...prev, allergies: e.target.value }))} className="rounded-lg text-sm" />
        </div>
      </div>

      <div className="bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Health Profile (Optional)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Height</Label>
            <Input placeholder="e.g. 5'8&quot;" value={settings.height} onChange={(e) => setSettings(prev => ({ ...prev, height: e.target.value }))} className="rounded-lg text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Weight</Label>
            <Input placeholder="e.g. 150 lbs" value={settings.weight} onChange={(e) => setSettings(prev => ({ ...prev, weight: e.target.value }))} className="rounded-lg text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Age</Label>
            <Input placeholder="e.g. 30" value={settings.age} onChange={(e) => setSettings(prev => ({ ...prev, age: e.target.value }))} className="rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <button onClick={saveSettings} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
        {saved ? <><FiCheck className="w-4 h-4" /> Saved</> : 'Save Defaults'}
      </button>
    </div>
  )
}

// ─── Agent Status ────────────────────────────────────────────────────────────

function AgentStatus({ isActive }: { isActive: boolean }) {
  return (
    <div className="bg-white/60 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">Meal Planner Agent</p>
          <p className="text-[10px] text-muted-foreground">ID: {AGENT_ID.slice(0, 8)}...</p>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px]">
          {isActive ? 'Active' : 'Idle'}
        </Badge>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Page() {
  // ─ Navigation
  const [activeScreen, setActiveScreen] = useState('planner')

  // ─ Sample data toggle
  const [showSample, setShowSample] = useState(false)

  // ─ Preferences
  const [prefsCollapsed, setPrefsCollapsed] = useState(false)
  const [budget, setBudget] = useState('Medium')
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['Breakfast', 'Lunch', 'Dinner', 'Snacks'])
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Indian', 'Mediterranean'])
  const [healthGoals, setHealthGoals] = useState<string[]>(['Better Energy', 'General Nutrition'])
  const [equipmentExclusions, setEquipmentExclusions] = useState<string[]>(['No Air Fryer'])
  const [allergies, setAllergies] = useState('')
  const [newExclusion, setNewExclusion] = useState('')

  // ─ Meal plan state
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // ─ Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vegfit_settings')
      if (stored) {
        const s = JSON.parse(stored) as UserSettings
        if (s.budget) setBudget(s.budget)
        if (Array.isArray(s.meals)) setSelectedMeals(s.meals)
        if (Array.isArray(s.cuisines)) setSelectedCuisines(s.cuisines)
        if (Array.isArray(s.healthGoals)) setHealthGoals(s.healthGoals)
        if (Array.isArray(s.equipmentExclusions)) setEquipmentExclusions(s.equipmentExclusions)
        if (s.allergies) setAllergies(s.allergies)
      }
    } catch { /* ignore */ }
  }, [])

  // ─ Display data based on sample toggle
  const displayData = useMemo(() => {
    if (showSample && !mealPlan) return getSampleData()
    return mealPlan
  }, [showSample, mealPlan])

  // ─ Generate meal plan
  const generateMealPlan = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)
    setStatusMessage(null)

    try {
      const message = `Generate a 7-day vegetarian meal plan with these preferences:
- Budget: ${budget}
- Meals per day: ${selectedMeals.join(', ')}
- Cuisine preferences: ${selectedCuisines.join(', ')}
- Health goals: ${healthGoals.join(', ')}
- Equipment exclusions: ${equipmentExclusions.join(', ')}
- Allergies/dislikes: ${allergies || 'None'}

Return the complete meal plan as JSON.`

      const result = await safeCallAgent(message, AGENT_ID)
      const parsed = parseAgentResponse(result)

      if (parsed) {
        setMealPlan(parsed)
        setPrefsCollapsed(true)
        setStatusMessage('Meal plan generated successfully!')

        // Save plan
        try {
          const saved = localStorage.getItem('vegfit_saved_plans')
          const plans: SavedPlan[] = saved ? JSON.parse(saved) : []
          const newPlan: SavedPlan = {
            id: `plan_${Date.now()}`,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            budget,
            cuisines: selectedCuisines,
            data: parsed,
          }
          plans.unshift(newPlan)
          if (plans.length > 10) plans.pop()
          localStorage.setItem('vegfit_saved_plans', JSON.stringify(plans))
        } catch { /* ignore */ }
      } else {
        const errMsg = result?.error || result?.response?.message || 'Could not parse meal plan response. Please try again.'
        setError(errMsg)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the meal plan.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [budget, selectedMeals, selectedCuisines, healthGoals, equipmentExclusions, allergies])

  // ─ Regenerate a day
  const regenerateDay = useCallback(async (day: string) => {
    setRegeneratingDay(day)
    setActiveAgentId(AGENT_ID)
    setError(null)

    try {
      const message = `Regenerate ONLY the meals for ${day} in my vegetarian meal plan with these preferences:
- Budget: ${budget}
- Meals needed: ${selectedMeals.join(', ')}
- Cuisine preferences: ${selectedCuisines.join(', ')}
- Health goals: ${healthGoals.join(', ')}
- Equipment exclusions: ${equipmentExclusions.join(', ')}
- Allergies/dislikes: ${allergies || 'None'}

Return ONLY the data for ${day} in the same JSON format as the dayDetails for a single day, with the "meals" array.`

      const result = await safeCallAgent(message, AGENT_ID)
      const parsed = parseAgentResponse(result)

      if (parsed && mealPlan) {
        const updated = { ...mealPlan }
        if (parsed.dayDetails?.[day]) {
          updated.dayDetails = { ...(updated.dayDetails || {}), [day]: parsed.dayDetails[day] }
        } else if (parsed.dayDetails) {
          const firstKey = Object.keys(parsed.dayDetails)[0]
          if (firstKey) {
            updated.dayDetails = { ...(updated.dayDetails || {}), [day]: parsed.dayDetails[firstKey] }
          }
        }
        if (parsed.weeklyOverview?.[day]) {
          updated.weeklyOverview = { ...(updated.weeklyOverview || {}), [day]: parsed.weeklyOverview[day] }
        }
        setMealPlan(updated)
        setStatusMessage(`${DAY_LABELS[day] ?? day} regenerated successfully!`)
      }
    } catch (err) {
      setError(`Failed to regenerate ${DAY_LABELS[day] ?? day}. Please try again.`)
    } finally {
      setRegeneratingDay(null)
      setActiveAgentId(null)
    }
  }, [budget, selectedMeals, selectedCuisines, healthGoals, equipmentExclusions, allergies, mealPlan])

  // ─ Load saved plan
  const loadSavedPlan = useCallback((plan: SavedPlan) => {
    setMealPlan(plan.data)
    setBudget(plan.budget)
    if (Array.isArray(plan.cuisines)) setSelectedCuisines(plan.cuisines)
    setPrefsCollapsed(true)
    setActiveScreen('planner')
    setStatusMessage('Plan loaded successfully!')
  }, [])

  // ─ Clear status after timeout
  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [statusMessage])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/60 to-teal-50/40 text-foreground flex">
        {/* Sidebar */}
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/50 backdrop-blur-[16px] border-b border-white/[0.18] px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {activeScreen === 'planner' && 'Weekly Meal Planner'}
                {activeScreen === 'saved' && 'Saved Plans'}
                {activeScreen === 'settings' && 'Settings'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeScreen === 'planner' && 'Plan your perfect vegetarian week'}
                {activeScreen === 'saved' && 'Access your previously generated plans'}
                {activeScreen === 'settings' && 'Customize your default preferences'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <main className="p-6 space-y-5 max-w-6xl">
              {/* Status message */}
              {statusMessage && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                  <FiCheck className="w-4 h-4" /> {statusMessage}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                  <FiX className="w-4 h-4" /> {error}
                  <button onClick={() => setError(null)} className="ml-auto text-destructive/60 hover:text-destructive"><FiX className="w-3 h-3" /></button>
                </div>
              )}

              {/* ─ Planner Screen ─ */}
              {activeScreen === 'planner' && (
                <>
                  {/* Preferences */}
                  <PreferencesPanel
                    collapsed={prefsCollapsed}
                    onToggle={() => setPrefsCollapsed(!prefsCollapsed)}
                    budget={budget}
                    setBudget={setBudget}
                    selectedMeals={selectedMeals}
                    setSelectedMeals={setSelectedMeals}
                    selectedCuisines={selectedCuisines}
                    setSelectedCuisines={setSelectedCuisines}
                    healthGoals={healthGoals}
                    setHealthGoals={setHealthGoals}
                    equipmentExclusions={equipmentExclusions}
                    setEquipmentExclusions={setEquipmentExclusions}
                    allergies={allergies}
                    setAllergies={setAllergies}
                    newExclusion={newExclusion}
                    setNewExclusion={setNewExclusion}
                  />

                  {/* Generate Button */}
                  <button onClick={generateMealPlan} disabled={loading} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        <span>Crafting your week...</span>
                      </>
                    ) : (
                      <>
                        <LuChefHat className="w-5 h-5" />
                        <span>Generate Meal Plan</span>
                      </>
                    )}
                  </button>

                  {/* Results */}
                  {displayData ? (
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="w-full justify-start bg-white/60 backdrop-blur-[16px] border border-white/[0.18] rounded-xl p-1 h-auto">
                        <TabsTrigger value="overview" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 text-xs font-medium">
                          <FiList className="w-3.5 h-3.5" /> Weekly Overview
                        </TabsTrigger>
                        <TabsTrigger value="daybyDay" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 text-xs font-medium">
                          <FiCalendar className="w-3.5 h-3.5" /> Day-by-Day
                        </TabsTrigger>
                        <TabsTrigger value="shopping" className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-4 py-2 text-xs font-medium">
                          <FiShoppingCart className="w-3.5 h-3.5" /> Shopping List
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-4">
                        <WeeklyOverviewTab data={displayData} />
                      </TabsContent>

                      <TabsContent value="daybyDay" className="mt-4">
                        <DayByDayTab data={displayData} onRegenerateDay={regenerateDay} regeneratingDay={regeneratingDay} />
                      </TabsContent>

                      <TabsContent value="shopping" className="mt-4">
                        <ShoppingListTab data={displayData} />
                      </TabsContent>
                    </Tabs>
                  ) : !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-secondary/60 flex items-center justify-center mb-5">
                        <LuSalad className="w-9 h-9 text-muted-foreground" />
                      </div>
                      <h2 className="text-base font-semibold text-foreground mb-2">Ready to plan your week</h2>
                      <p className="text-sm text-muted-foreground max-w-md mb-1">Set your preferences above and click Generate Meal Plan to create a personalized 7-day vegetarian meal plan.</p>
                      <p className="text-xs text-muted-foreground">Toggle "Sample Data" in the top-right corner to preview the interface.</p>
                    </div>
                  ) : null}

                  {/* Regenerate full plan */}
                  {mealPlan && !loading && (
                    <div className="flex justify-center pt-2">
                      <button onClick={generateMealPlan} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                        <FiRefreshCw className="w-4 h-4" /> Regenerate Full Plan
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─ Saved Plans Screen ─ */}
              {activeScreen === 'saved' && (
                <SavedPlansScreen onLoadPlan={loadSavedPlan} />
              )}

              {/* ─ Settings Screen ─ */}
              {activeScreen === 'settings' && (
                <SettingsScreen />
              )}

              {/* Agent status */}
              <div className="pt-4">
                <AgentStatus isActive={activeAgentId !== null} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
