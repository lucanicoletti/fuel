import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { Header } from './components/Header';
import { Tabs, type TabKey } from './components/Tabs';
import { WeekPlanView } from './components/WeekPlanView';
import { ShoppingListView } from './components/ShoppingListView';
import { RecipesView } from './components/RecipesView';
import { RecipeEditor } from './components/RecipeEditor';
import { SavedPlansView } from './components/SavedPlansView';
import { MealModal } from './components/MealModal';
import { supabase } from './lib/supabase';
import type { DayName, DayPlan, Recipe, RecipePair, WeekPlan } from './lib/types';
import { generateWeek } from './lib/generator';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabKey>('plan');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pairs, setPairs] = useState<RecipePair[]>([]);
  const [savedPlans, setSavedPlans] = useState<WeekPlan[]>([]);

  const [plans, setPlans] = useState<[DayPlan[] | null, DayPlan[] | null]>([null, null]);
  const [activeWeek, setActiveWeek] = useState(0);
  const [chocState, setChocState] = useState<[Partial<Record<DayName, boolean>>, Partial<Record<DayName, boolean>>]>([{}, {}]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const [modalRecipeId, setModalRecipeId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void loadData();
  }, [session]);

  async function loadData() {
    const [r, p, w] = await Promise.all([
      supabase.from('recipes').select('*').order('slug'),
      supabase.from('recipe_pairs').select('*'),
      supabase.from('week_plans').select('*').order('week_start_date', { ascending: false }),
    ]);
    if (r.data) setRecipes(r.data as Recipe[]);
    if (p.data) setPairs(p.data as RecipePair[]);
    if (w.data) setSavedPlans(w.data as WeekPlan[]);
  }

  function generateBothWeeks() {
    const breakfast = recipes.find(r => r.slug === 'breakfast');
    const snack = recipes.find(r => r.slug === 'snack');
    if (!breakfast || !snack) {
      alert('Missing breakfast or snack recipe — check seed data.');
      return;
    }
    const w1 = generateWeek({ recipes, pairs, fixedBreakfast: breakfast, fixedSnack: snack });
    const w2 = generateWeek({ recipes, pairs, fixedBreakfast: breakfast, fixedSnack: snack });
    setPlans([w1, w2]);
    setActiveWeek(0);
    setChocState([{}, {}]);
    setGeneratedAt(new Date());
  }

  function toggleChoc(weekIdx: 0 | 1, day: DayName) {
    setChocState(prev => {
      const next = [...prev] as [Partial<Record<DayName, boolean>>, Partial<Record<DayName, boolean>>];
      next[weekIdx] = { ...next[weekIdx], [day]: !next[weekIdx][day] };
      return next;
    });
  }

  async function saveWeek(weekIdx: 0 | 1, weekStartDate: string, label: string | null) {
    const plan = plans[weekIdx];
    if (!plan) return;
    const choc = chocState[weekIdx];
    const { data, error } = await supabase.from('week_plans').insert({
      week_start_date: weekStartDate,
      label,
      days: plan,
      choc_state: choc,
    }).select().single();
    if (error) { alert(error.message); return; }
    if (data) setSavedPlans(prev => [data as WeekPlan, ...prev]);
    alert('Saved.');
  }

  function loadSavedPlan(p: WeekPlan) {
    setPlans([p.days, null]);
    setActiveWeek(0);
    setChocState([p.choc_state, {}]);
    setGeneratedAt(new Date(p.created_at));
    setTab('plan');
  }

  if (authLoading) {
    return <div className="auth-screen"><div style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>…</div></div>;
  }

  if (!session) return <AuthGate />;

  return (
    <>
      <Header />
      <Tabs tab={tab} onChange={setTab} />

      {tab === 'plan' && (
        <WeekPlanView
          plans={plans}
          activeWeek={activeWeek}
          setActiveWeek={setActiveWeek}
          chocState={chocState}
          toggleChoc={toggleChoc}
          generatedAt={generatedAt}
          onGenerate={generateBothWeeks}
          onOpenRecipe={setModalRecipeId}
          onSaveWeek={saveWeek}
        />
      )}
      {tab === 'shop' && (
        <ShoppingListView plans={plans} pairs={pairs} />
      )}
      {tab === 'recipes' && (
        <RecipesView recipes={recipes} pairs={pairs} onOpen={setModalRecipeId} />
      )}
      {tab === 'editor' && (
        <RecipeEditor recipes={recipes} pairs={pairs} onChange={loadData} />
      )}
      {tab === 'saved' && (
        <SavedPlansView plans={savedPlans} onLoad={loadSavedPlan} onChange={loadData} />
      )}

      <MealModal
        recipeId={modalRecipeId}
        recipes={recipes}
        plans={plans}
        onClose={() => setModalRecipeId(null)}
      />
    </>
  );
}
