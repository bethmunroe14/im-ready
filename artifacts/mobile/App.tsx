import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type FoundingMemberKind = 'planned-provider' | 'persona-preset';

type FoundingMember = {
  name: string;
  role: string;
  personality: string;
  department: string;
  kind: FoundingMemberKind;
};

type Task = { id: string; title: string; done: boolean };

const FOUNDING_MEMBERS: FoundingMember[] = [
  {
    name: 'Nova',
    role: 'Lead assistant',
    personality: 'Warm, clear and encouraging',
    department: 'Planning',
    kind: 'planned-provider',
  },
  {
    name: 'Muse',
    role: 'Thoughtful assistant',
    personality: 'Calm, careful and helpful',
    department: 'Reflection',
    kind: 'planned-provider',
  },
  {
    name: 'Atlas',
    role: 'Steady guide',
    personality: 'Grounded, practical and reassuring',
    department: 'Routines',
    kind: 'persona-preset',
  },
  {
    name: 'Lyra',
    role: 'Creative companion',
    personality: 'Bright, curious and imaginative',
    department: 'Creativity',
    kind: 'persona-preset',
  },
];

const PROVIDERS: { name: string; status: 'Planned' }[] = [
  { name: 'ChatGPT', status: 'Planned' },
  { name: 'Muse', status: 'Planned' },
  { name: 'Meta AI', status: 'Planned' },
  { name: 'Grok', status: 'Planned' },
  { name: 'Gemini', status: 'Planned' },
  { name: 'Claude', status: 'Planned' },
  { name: 'Copilot', status: 'Planned' },
  { name: 'Perplexity', status: 'Planned' },
  { name: 'DeepSeek', status: 'Planned' },
  { name: 'Mistral', status: 'Planned' },
  { name: 'Llama', status: 'Planned' },
];

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
const COUNCIL_SELECTION_STORAGE_KEY = 'im-ready-council-selection';
const STARTER_TASKS: Task[] = [
  { id: '1', title: 'Check today’s priorities', done: false },
  { id: '2', title: 'Take a little time for yourself', done: false },
  { id: '3', title: 'Review your goals', done: false },
];

const isCouncilSelection = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every(
    (name: unknown) =>
      typeof name === 'string' &&
      FOUNDING_MEMBERS.some((member) => member.name === name),
  );

type Tab = 'Home' | 'My Day' | 'Goals' | 'Profile';
type Screen = 'home' | 'council';

export default function App() {
  const [tab, setTab] = useState<Tab>('Home');
  const [screen, setScreen] = useState<Screen>('home');
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [tasks, setTasks] = useState(STARTER_TASKS);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [tasksLoadFailed, setTasksLoadFailed] = useState(false);
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([]);
  const [councilSelectionLoaded, setCouncilSelectionLoaded] = useState(false);
  const [councilSelectionLoadFailed, setCouncilSelectionLoadFailed] = useState(false);
  const [meetingPaused, setMeetingPaused] = useState<boolean>(false);
  const [meetingEnded, setMeetingEnded] = useState<boolean>(false);
  const [mutedMembers, setMutedMembers] = useState<string[]>([]);
  const [dismissedMembers, setDismissedMembers] = useState<string[]>([]);
  const [redirectInstruction, setRedirectInstruction] = useState<string>('');
  const [redirectInput, setRedirectInput] = useState<string>('');
  const [queenMessage, setQueenMessage] = useState<string>('');
  const [confirmingDismiss, setConfirmingDismiss] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState<boolean>(false);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [interruptedSpeaker, setInterruptedSpeaker] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (!isActive) {
          return;
        }
        if (savedTasks !== null) {
          let parsedTasks: unknown;
          try {
            parsedTasks = JSON.parse(savedTasks);
          } catch (error) {
            console.warn('Unable to parse saved tasks; using starter tasks.', error);
            setTasks(STARTER_TASKS);
            setTasksLoaded(true);
            return;
          }
          if (Array.isArray(parsedTasks)) {
            const validTasks = parsedTasks.filter(
              (task: unknown): task is Task =>
                typeof task === 'object' &&
                task !== null &&
                typeof (task as { id: unknown }).id === 'string' &&
                typeof (task as { title: unknown }).title === 'string' &&
                typeof (task as { done: unknown }).done === 'boolean',
            );
            setTasks(validTasks);
          } else {
            console.warn('Saved tasks were malformed; using starter tasks.');
            setTasks(STARTER_TASKS);
          }
        }
        setTasksLoaded(true);
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.warn('Unable to load saved tasks.', error);
        setTasksLoadFailed(true);
        setTasksLoaded(true);
      }
    };

    void loadTasks();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!tasksLoaded || tasksLoadFailed) {
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
  }, [tasks, tasksLoaded, tasksLoadFailed]);

  useEffect(() => {
    let isActive = true;

    const loadCouncilSelection = async () => {
      try {
        const savedSelection = await AsyncStorage.getItem(
          COUNCIL_SELECTION_STORAGE_KEY,
        );
        if (!isActive) {
          return;
        }
        if (savedSelection !== null) {
          let parsedSelection: unknown;
          try {
            parsedSelection = JSON.parse(savedSelection);
          } catch (error) {
            console.warn('Unable to parse saved Council selection.', error);
            setSelectedMemberNames([]);
            setCouncilSelectionLoaded(true);
            return;
          }
          if (!isCouncilSelection(parsedSelection)) {
            setSelectedMemberNames([]);
            setCouncilSelectionLoaded(true);
            return;
          }
          setSelectedMemberNames(parsedSelection);
        }
        setCouncilSelectionLoaded(true);
      } catch (error) {
        console.warn('Unable to load Council selection.', error);
        if (!isActive) {
          return;
        }
        setCouncilSelectionLoadFailed(true);
        setCouncilSelectionLoaded(true);
      }
    };

    void loadCouncilSelection();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!councilSelectionLoaded || councilSelectionLoadFailed) {
      return;
    }

    const saveCouncilSelection = async () => {
      try {
        await AsyncStorage.setItem(
          COUNCIL_SELECTION_STORAGE_KEY,
          JSON.stringify(selectedMemberNames),
        );
      } catch (error) {
        console.warn('Unable to save Council selection.', error);
      }
    };

    void saveCouncilSelection();
  }, [selectedMemberNames, councilSelectionLoaded, councilSelectionLoadFailed]);

  const toggleCouncilMember = (memberName: string) => {
    setCouncilSelectionLoadFailed(false);
    setSelectedMemberNames((current) =>
      current.includes(memberName)
        ? current.filter((name) => name !== memberName)
        : [...current, memberName],
    );
  };

  const selectAllCouncilMembers = () => {
    setCouncilSelectionLoadFailed(false);
    setSelectedMemberNames(FOUNDING_MEMBERS.map((member) => member.name));
  };

  const clearAllCouncilMembers = () => {
    setCouncilSelectionLoadFailed(false);
    setSelectedMemberNames([]);
  };

  const activeCouncilMembers = selectedMemberNames
    .map((name) => FOUNDING_MEMBERS.find((member) => member.name === name))
    .filter(
      (member): member is FoundingMember =>
        member !== undefined && !dismissedMembers.includes(member.name),
    );

  const beginQueenAction = () => {
    if (actionBusy) {
      return false;
    }
    setActionBusy(true);
    setTimeout(() => setActionBusy(false), 300);
    return true;
  };

  const interruptCouncil = () => {
    if (actionBusy || meetingPaused || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setInterruptedSpeaker(activeCouncilMembers[0]?.name ?? null);
    setQueenMessage('Speaking turn interrupted.');
  };

  const toggleMemberMute = (memberName: string) => {
    if (actionBusy || meetingPaused || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    const isMuted = mutedMembers.includes(memberName);
    setMutedMembers((current) =>
      isMuted
        ? current.filter((name) => name !== memberName)
        : [...current, memberName],
    );
    setQueenMessage(`${memberName} ${isMuted ? 'unmuted' : 'muted'}.`);
  };

  const pauseCouncil = () => {
    if (actionBusy || meetingPaused || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setMeetingPaused(true);
    setQueenMessage('Council paused.');
  };

  const resumeCouncil = () => {
    if (actionBusy || !meetingPaused || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setMeetingPaused(false);
    setQueenMessage('Council resumed.');
  };

  const setCouncilRedirect = () => {
    if (actionBusy || meetingPaused || meetingEnded || !redirectInput.trim()) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setRedirectInstruction(redirectInput.trim());
    setRedirectInput('');
    setQueenMessage('New instruction set.');
  };

  const requestMemberDismiss = (memberName: string) => {
    if (actionBusy || meetingPaused || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setConfirmingDismiss(memberName);
    setQueenMessage(`Confirm dismissing ${memberName}?`);
  };

  const confirmMemberDismiss = () => {
    if (actionBusy || meetingPaused || meetingEnded || !confirmingDismiss) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    const memberName = confirmingDismiss;
    setDismissedMembers((current) =>
      current.includes(memberName) ? current : [...current, memberName],
    );
    setConfirmingDismiss(null);
    setQueenMessage(`${memberName} dismissed from this meeting. Profile kept.`);
  };

  const cancelMemberDismiss = () => {
    if (!beginQueenAction()) {
      return;
    }
    setConfirmingDismiss(null);
    setQueenMessage('Dismissal cancelled.');
  };

  const requestEndMeeting = () => {
    if (actionBusy || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setConfirmingEnd(true);
    setQueenMessage('Confirm ending this meeting?');
  };

  const confirmEndMeeting = () => {
    if (actionBusy || meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setMeetingEnded(true);
    setMeetingPaused(false);
    setConfirmingEnd(false);
    setQueenMessage('Meeting ended. History and saved selections kept.');
  };

  const cancelEndMeeting = () => {
    if (!beginQueenAction()) {
      return;
    }
    setConfirmingEnd(false);
    setQueenMessage('Ending meeting cancelled.');
  };

  const startNewMeeting = () => {
    if (actionBusy || !meetingEnded) {
      return;
    }
    if (!beginQueenAction()) {
      return;
    }
    setMeetingEnded(false);
    setDismissedMembers([]);
    setMutedMembers([]);
    setInterruptedSpeaker(null);
    setRedirectInstruction('');
    setConfirmingDismiss(null);
    setConfirmingEnd(false);
    setQueenMessage('New meeting started.');
  };

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  const toggleTask = (id: string) => {
    setTasksLoadFailed(false);
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
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${tasks.length === 0 ? 0 : (completed / tasks.length) * 100}%` }]} /></View>
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
        <QuickCard icon="✨" title="AI Council" subtitle="Work together" onPress={() => setScreen('council')} />
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
      <Text style={styles.explainer}>Planned provider association — assistant identities are planned to be associated with a provider; persona presets are character-inspired identities, not backed by a provider.</Text>
      <View style={styles.card}>
        {FOUNDING_MEMBERS.map((member) => (
          <View key={member.name} style={styles.taskRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{member.name}</Text>
              <Text style={styles.progressText}>
                {member.kind === 'planned-provider'
                  ? 'Planned provider association'
                  : 'Persona preset — character-inspired, not backed by a provider'}
              </Text>
              <Text style={styles.cardSub}>Role: {member.role}</Text>
              <Text style={styles.cardSub}>Personality: {member.personality}</Text>
              <Text style={styles.cardSub}>Department: {member.department}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Provider directory</Text></View>
      <View style={styles.card}>
        {PROVIDERS.map((provider) => (
          <View key={provider.name} style={[styles.taskRow, styles.progressRow]}>
            <Text style={styles.cardTitle}>{provider.name}</Text>
            <Text style={styles.progressText}>{provider.status}</Text>
          </View>
        ))}
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Meeting picker</Text></View>
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={selectAllCouncilMembers} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAllCouncilMembers} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        {FOUNDING_MEMBERS.map((member) => {
          const isSelected = selectedMemberNames.includes(member.name);
          return (
            <TouchableOpacity
              key={member.name}
              style={[styles.taskRow, styles.progressRow]}
              onPress={() => toggleCouncilMember(member.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.check, isSelected && styles.checkDone]}>
                {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.taskText}>{member.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Queen's controls</Text></View>
      <View style={styles.queenPanel}>
        <Text style={styles.queenStatus}>
          Meeting: {meetingEnded ? 'Ended' : meetingPaused ? 'Paused' : 'Active'}
        </Text>
        <Text style={styles.queenStatus}>
          Current speaker: {meetingEnded ? 'None' : interruptedSpeaker ? 'Interrupted' : activeCouncilMembers[0]?.name ?? 'None'}
        </Text>
        <Text style={styles.queenNote}>
          Prototype controls — no live voice or AI connection yet. Providers are Planned. Mute, Interrupt and Redirect update this prototype only.
        </Text>
        <View style={styles.queenControlRow}>
          <TouchableOpacity
            style={[styles.queenButton, (activeCouncilMembers.length === 0 || meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
            onPress={interruptCouncil}
            disabled={activeCouncilMembers.length === 0 || meetingPaused || meetingEnded || actionBusy}
            accessibilityRole="button"
            accessibilityLabel="Interrupt selected speaker (prototype only)"
            testID="interruptCouncil"
          >
            <Text style={styles.queenButtonText}>Interrupt (prototype)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.queenButton, (meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
            onPress={pauseCouncil}
            disabled={meetingPaused || meetingEnded || actionBusy}
            accessibilityRole="button"
            accessibilityLabel="Pause Council meeting"
            testID="pauseCouncil"
          >
            <Text style={styles.queenButtonText}>Pause Council</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.queenButton, (!meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
            onPress={resumeCouncil}
            disabled={!meetingPaused || meetingEnded || actionBusy}
            accessibilityRole="button"
            accessibilityLabel="Resume Council meeting"
            testID="resumeCouncil"
          >
            <Text style={styles.queenButtonText}>Resume Council</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.queenRedirectRow}>
            <TextInput
              style={styles.queenInput}
              value={redirectInput}
              onChangeText={setRedirectInput}
              onSubmitEditing={setCouncilRedirect}
              placeholder="New topic or instruction for the Council…"
              placeholderTextColor={C.muted}
              accessibilityRole="text"
              accessibilityLabel="Redirect instruction"
              testID="queenRedirectInput"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.queenButton, styles.queenRedirectButton, (!redirectInput.trim() || meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
              onPress={setCouncilRedirect}
              disabled={!redirectInput.trim() || meetingPaused || meetingEnded || actionBusy}
              accessibilityRole="button"
              accessibilityLabel="Set Council instruction (prototype only)"
              testID="setCouncilInstruction"
            >
              <Text style={styles.queenButtonText}>Set instruction</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        {redirectInstruction ? (
          <Text style={styles.queenInstruction}>
            Current instruction: {redirectInstruction}
          </Text>
        ) : null}
        <Text style={styles.queenSubheading}>Selected members</Text>
        {activeCouncilMembers.length === 0 ? (
          <Text style={styles.queenEmpty}>
            Select members in Meeting picker to show their controls here.
          </Text>
        ) : (
          activeCouncilMembers.map((member) => {
            const isMuted = mutedMembers.includes(member.name);
            return (
              <View key={member.name} style={styles.queenMemberRow}>
                <View style={styles.queenMemberInfo}>
                  <Text style={styles.queenMemberName}>{member.name}</Text>
                  <Text style={styles.queenMemberState}>
                    {isMuted ? 'Muted in this prototype' : 'Unmuted'}
                  </Text>
                </View>
                <View style={styles.queenMemberActions}>
                  <TouchableOpacity
                    style={[styles.queenButton, (meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
                    onPress={() => toggleMemberMute(member.name)}
                    disabled={meetingPaused || meetingEnded || actionBusy}
                    accessibilityRole="button"
                    accessibilityLabel={`${isMuted ? 'Unmute' : 'Mute'} ${member.name} (prototype only)`}
                    testID={`toggleMute-${member.name}`}
                  >
                    <Text style={styles.queenButtonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                  </TouchableOpacity>
                  {confirmingDismiss === member.name ? (
                    <>
                      <TouchableOpacity
                        style={[styles.queenButton, (meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
                        onPress={confirmMemberDismiss}
                        disabled={meetingPaused || meetingEnded || actionBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`Confirm dismissing ${member.name} from this meeting`}
                        testID={`confirmDismiss-${member.name}`}
                      >
                        <Text style={styles.queenButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.queenButton, actionBusy && styles.queenButtonDisabled]}
                        onPress={cancelMemberDismiss}
                        disabled={actionBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`Cancel dismissing ${member.name}`}
                        testID={`cancelDismiss-${member.name}`}
                      >
                        <Text style={styles.queenButtonSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.queenButton, styles.queenButtonSecondary, (meetingPaused || meetingEnded || actionBusy) && styles.queenButtonDisabled]}
                      onPress={() => requestMemberDismiss(member.name)}
                      disabled={meetingPaused || meetingEnded || actionBusy}
                      accessibilityRole="button"
                      accessibilityLabel={`Dismiss ${member.name} from this meeting`}
                      testID={`dismissMember-${member.name}`}
                    >
                      <Text style={styles.queenButtonSecondaryText}>Dismiss</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={styles.queenControlRow}>
          <TouchableOpacity
            style={[styles.queenButton, styles.queenEndButton, (meetingEnded || actionBusy) && styles.queenButtonDisabled]}
            onPress={requestEndMeeting}
            disabled={meetingEnded || actionBusy}
            accessibilityRole="button"
            accessibilityLabel="End Council meeting"
            testID="endCouncilMeeting"
          >
            <Text style={styles.queenButtonText}>End Meeting</Text>
          </TouchableOpacity>
          {confirmingEnd ? (
            <>
              <TouchableOpacity
                style={[styles.queenButton, styles.queenEndButton, actionBusy && styles.queenButtonDisabled]}
                onPress={confirmEndMeeting}
                disabled={actionBusy}
                accessibilityRole="button"
                accessibilityLabel="Confirm ending Council meeting"
                testID="confirmEndCouncilMeeting"
              >
                <Text style={styles.queenButtonText}>Confirm End Meeting</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.queenButton, styles.queenButtonSecondary, actionBusy && styles.queenButtonDisabled]}
                onPress={cancelEndMeeting}
                disabled={actionBusy}
                accessibilityRole="button"
                accessibilityLabel="Cancel ending Council meeting"
                testID="cancelEndCouncilMeeting"
              >
                <Text style={styles.queenButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {meetingEnded ? (
            <TouchableOpacity
              style={[styles.queenButton, actionBusy && styles.queenButtonDisabled]}
              onPress={startNewMeeting}
              disabled={actionBusy}
              accessibilityRole="button"
              accessibilityLabel="Start a new Council meeting"
              testID="startNewCouncilMeeting"
            >
              <Text style={styles.queenButtonText}>Start a new meeting</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {queenMessage ? (
          <Text style={styles.queenMessage} accessibilityLiveRegion="polite">
            {queenMessage}
          </Text>
        ) : null}
      </View>
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
          <TouchableOpacity key={name} style={styles.tabButton} onPress={() => { setOpportunitiesOpen(false); setScreen('home'); setTab(name); }} activeOpacity={0.7}>
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
  queenPanel: { backgroundColor: C.white, borderRadius: 19, padding: 15, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  queenNote: { color: C.navy, backgroundColor: C.pale, borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18, marginTop: 10 },
  queenStatus: { color: C.navy, fontSize: 14, fontWeight: '800', marginTop: 5 },
  queenControlRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8 },
  queenButton: { minHeight: 48, backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 8 },
  queenButtonDisabled: { opacity: 0.45 },
  queenButtonText: { color: C.white, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  queenButtonSecondary: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  queenButtonSecondaryText: { color: C.navy, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  queenEndButton: { backgroundColor: C.navy },
  queenRedirectRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  queenRedirectButton: { flexGrow: 1 },
  queenInput: { minHeight: 48, flexGrow: 1, flexBasis: 180, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, color: C.navy, backgroundColor: C.white, marginTop: 8 },
  queenInstruction: { color: C.navy, backgroundColor: C.pale, borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19, marginTop: 10 },
  queenSubheading: { color: C.navy, fontSize: 13, fontWeight: '800', marginTop: 18, marginBottom: 4 },
  queenEmpty: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  queenMemberRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  queenMemberInfo: { flexGrow: 1, flexBasis: 90, paddingVertical: 4 },
  queenMemberName: { color: C.navy, fontSize: 13, fontWeight: '800' },
  queenMemberState: { color: C.muted, fontSize: 11, marginTop: 3 },
  queenMemberActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  queenMessage: { color: C.navy, backgroundColor: C.pale, borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 18, marginTop: 14 },
});