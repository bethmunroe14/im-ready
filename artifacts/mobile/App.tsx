import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const C = {
  teal: '#0ABAB5',
  navy: '#101B35',
  white: '#FFFFFF',
  silver: '#DCE3EA',
  muted: '#718096',
  pale: '#EAF9F8',
  background: '#F5F8FA',
  line: '#E6ECF1',
};

const TASKS_STORAGE_KEY = 'im-ready-tasks';

type Tab = 'Home' | 'My Day' | 'Goals' | 'Profile';
type Screen = 'home' | 'council';

export default function App() {
  const [tab, setTab] = useState<Tab>('Home');
  const [screen, setScreen] = useState<Screen>('home');
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Check today’s priorities', done: false },
    { id: '2', title: 'Take a little time for yourself', done: false },
    { id: '3', title: 'Review your goals', done: false },
  ]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (!isActive) {
          return;
        }
        if (savedTasks !== null) {
          const parsedTasks = JSON.parse(savedTasks);
          if (Array.isArray(parsedTasks)) {
            const validTasks = parsedTasks.filter(                 (
                task: unknown): task is { id: string; title: string; done: boolean } =>                   
                  typeof task === 'object' &&                   task !== null &&                   typeof (task as { id: unknown }).id === 'string' &&                   
                  typeof (task as { title: unknown }).title === 'string' &&                   
                  typeof (task as { done: unknown }).done === 'boolean',               );
                             if (validTasks.length > 0) {                 
                              setTasks(validTasks);               }
          }
      
        }
      setTasksLoaded(true); } catch (error) {
        console.warn('Unable to load saved tasks.', error);
      }
    };

    void loadTasks();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!tasksLoaded) {
      return;
    }

    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.warn('Unable to save tasks.', error);
      }
    };

    void saveTasks();
  }, [tasks, tasksLoaded]);

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  };

  const renderHome = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.mascotPlaceholder}>
          <Text style={styles.mascotPlaceholderText}>MASCOT{'\n'}PLACEHOLDER</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>YOUR PERSONAL AI COMPANION</Text>
          <Text style={styles.heroTitle}>You’re ready.{ '\n' }Let’s make today count.</Text>
          <Text style={styles.heroSub}>One place for your plans, ideas and next steps.</Text>
        </View>
        <Text style={styles.mascotNote}>Mascot placeholder — the exact winged-unicorn Muse artwork goes here. No substitute image is used.</Text>
      </View>

      <TouchableOpacity style={styles.findButton} onPress={() => setOpportunitiesOpen(true)} activeOpacity={0.85}>
        <Text style={styles.findButtonText}>FIND ME OPPORTUNITIES</Text>
      </TouchableOpacity>
      <Text style={styles.explainer}>I’m Ready helps you find work and income opportunities that fit you, and keeps your plans, tasks and goals in one place.</Text>

      <TouchableOpacity style={styles.aiCard} onPress={() => setScreen('council')} activeOpacity={0.85}>
        <View style={styles.aiIcon}><Text style={styles.aiIconText}>✦</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Talk to your AI team</Text>
          <Text style={styles.cardSub}>Ask a question, plan something or get help.</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your day</Text>
        <TouchableOpacity onPress={() => setTab('My Day')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.progressRow}>
          <Text style={styles.cardTitle}>A few small steps</Text>
          <Text style={styles.progressText}>{completed}/{tasks.length} done</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(completed / tasks.length) * 100}%` }]} /></View>
        {tasks.slice(0, 2).map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id)} activeOpacity={0.7}>
            <View style={[styles.check, task.done && styles.checkDone]}>{task.done ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your spaces</Text></View>
      <View style={styles.grid}>
        <QuickCard icon="☀️" title="My Day" subtitle="Tasks & routines" onPress={() => setTab('My Day')} />
        <QuickCard icon="🎯" title="Goals" subtitle="Make progress" onPress={() => setTab('Goals')} />
        <QuickCard icon="✨" title="AI Council" subtitle="Work together" onPress={() => setTab('Profile')} />
        <QuickCard icon="💼" title="Income Finder" subtitle="Explore work" onPress={() => setTab('Goals')} />
      </View>
    </>
  );

  const renderOpportunities = () => (
    <View style={styles.emptyPanel}>
      <View style={styles.largeIcon}><Text style={{ fontSize: 34 }}>💼</Text></View>
      <Text style={styles.emptyTitle}>Opportunities for you</Text>
      <Text style={styles.emptySub}>Matched work and income opportunities will appear here. For now, this is a preview of the flow — connecting to real opportunities comes next.</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => setOpportunitiesOpen(false)} activeOpacity={0.8}>
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOther = () => {
    const content: Record<Exclude<Tab, 'Home'>, { title: string; sub: string; icon: string }> = {
      'My Day': { title: 'Your day, your pace.', sub: 'A flexible place for tasks and routines. You can change or reschedule anything.', icon: '☀️' },
      Goals: { title: 'Small steps add up.', sub: 'Keep your personal goals and projects moving forward.', icon: '🎯' },
      Profile: { title: 'Your I’m Ready space.', sub: 'Manage your preferences, connected services and AI team when those features are added.', icon: '⚙️' },
    };
    const item = content[tab as Exclude<Tab, 'Home'>];
    return (
      <View style={styles.emptyPanel}>
        <View style={styles.largeIcon}><Text style={{ fontSize: 34 }}>{item.icon}</Text></View>
        <Text style={styles.emptyTitle}>{item.title}</Text>
        <Text style={styles.emptySub}>{item.sub}</Text>
        {tab === 'My Day' ? tasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskRowFull} onPress={() => toggleTask(task.id)}>
            <View style={[styles.check, task.done && styles.checkDone]}>{task.done ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.title}</Text>
          </TouchableOpacity>
        )) : null}
        {tab === 'Profile' ? <Text style={styles.comingSoon}>AI connections and account settings will be added in later build steps.</Text> : null}
      </View>
    );
  };

  const renderCouncil = () => (
    <View>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your AI team</Text>
        <TouchableOpacity onPress={() => setScreen('home')} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Founding members</Text></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Provider directory</Text></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Meeting picker</Text></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Queen's controls</Text></View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>IR</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName}>I’m Ready</Text>
          <Text style={styles.brandTag}>YOUR LIFE, IN ONE PLACE</Text>
        </View>
        <View style={styles.statusDot} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {screen === 'council' ? renderCouncil() : tab === 'Home' ? (opportunitiesOpen ? renderOpportunities() : renderHome()) : renderOther()}
        <Text style={styles.footer}>A little more organized. A little more you.</Text>
      </ScrollView>
      <View style={styles.tabBar}>
        {(['Home', 'My Day', 'Goals', 'Profile'] as Tab[]).map((name) => (
          <TouchableOpacity key={name} style={styles.tabButton} onPress={() => { setOpportunitiesOpen(false); setTab(name); }} activeOpacity={0.7}>
            <Text style={[styles.tabIcon, tab === name && styles.tabActive]}>{({ Home: '⌂', 'My Day': '☑', Goals: '◎', Profile: '○' } as Record<Tab, string>)[name]}</Text>
            <Text style={[styles.tabLabel, tab === name && styles.tabLabelActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function QuickCard({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  brandMarkText: { color: C.white, fontWeight: '900', fontSize: 15 },
  brandName: { color: C.navy, fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
  brandTag: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 2 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.teal },
  content: { paddingHorizontal: 18, paddingBottom: 22 },
  hero: { backgroundColor: C.navy, borderRadius: 25, padding: 20, minHeight: 210, overflow: 'hidden' },
  mascotPlaceholder: { position: 'absolute', right: 16, top: 16, width: 78, height: 78, borderRadius: 12, backgroundColor: 'rgba(10,186,181,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.55)' },
  mascotPlaceholderText: { color: C.white, fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5, lineHeight: 11 },
  heroCopy: { paddingTop: 10, paddingRight: 78 },
  eyebrow: { color: C.teal, fontWeight: '800', fontSize: 9, letterSpacing: 1.4, marginBottom: 12 },
  heroTitle: { color: C.white, fontWeight: '900', fontSize: 27, lineHeight: 32, letterSpacing: -0.7 },
  heroSub: { color: '#D4DFE9', fontSize: 12, lineHeight: 18, marginTop: 10 },
  mascotNote: { color: '#AEBCCB', fontSize: 9, marginTop: 18 },
  findButton: { backgroundColor: C.teal, borderRadius: 18, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  findButtonText: { color: C.white, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  explainer: { color: C.navy, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 12, paddingHorizontal: 10 },
  backButton: { backgroundColor: C.teal, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backButtonText: { color: C.white, fontWeight: '900', fontSize: 14 },
  aiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 19, padding: 15, marginTop: 14, borderWidth: 1, borderColor: C.line },
  aiIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiIconText: { color: C.teal, fontSize: 24, fontWeight: '800' },
  cardTitle: { color: C.navy, fontSize: 14, fontWeight: '800' },
  cardSub: { color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  arrow: { color: C.teal, fontSize: 28, marginLeft: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 10 },
  sectionTitle: { color: C.navy, fontWeight: '900', fontSize: 17, letterSpacing: -0.3 },
  seeAll: { color: C.teal, fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: C.white, borderRadius: 19, padding: 15, borderWidth: 1, borderColor: C.line },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText: { color: C.teal, fontWeight: '800', fontSize: 11 },
  progressTrack: { height: 6, borderRadius: 4, backgroundColor: C.silver, marginTop: 12, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.teal, borderRadius: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  taskRowFull: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line, width: '100%' },
  check: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: '#B8C5D0', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: C.teal, borderColor: C.teal },
  checkMark: { color: C.white, fontSize: 13, fontWeight: '900' },
  taskText: { color: C.navy, fontSize: 12, fontWeight: '600', flex: 1 },
  taskDone: { color: C.muted, textDecorationLine: 'line-through' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickCard: { width: '48.2%', backgroundColor: C.white, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line, minHeight: 112 },
  quickIcon: { fontSize: 22, marginBottom: 10 },
  quickTitle: { color: C.navy, fontSize: 13, fontWeight: '800' },
  quickSub: { color: C.muted, fontSize: 10, marginTop: 4 },
  emptyPanel: { backgroundColor: C.white, borderRadius: 24, minHeight: 350, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: C.line },
  largeIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 18 },
  emptyTitle: { color: C.navy, fontWeight: '900', fontSize: 23, textAlign: 'center' },
  emptySub: { color: C.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 20 },
  comingSoon: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 20 },
  footer: { color: C.muted, textAlign: 'center', fontSize: 10, paddingVertical: 18 },
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 9, paddingBottom: 8 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  tabIcon: { color: '#9AA7B4', fontSize: 21, fontWeight: '700' },
  tabActive: { color: C.teal },
  tabLabel: { color: C.muted, fontSize: 9, marginTop: 3, fontWeight: '600' },
  tabLabelActive: { color: C.teal, fontWeight: '900' },
});