// Fictional demo profile used until real accounts exist. "Maya R." is not a
// real person; every value below is made up for the prototype.

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

export function demoState(base) {
  const now = new Date().toISOString();
  return {
    ...base,
    profile: { displayName: "Maya R.", initials: "MR", demo: true },
    appointment: {
      ...base.appointment,
      date: isoDaysFromNow(16),
      time: "10:30",
      type: "New patient",
      specialty: "Orthopedics / Hand",
      clinician: "Dr. Lena Ortiz (fictional)",
      reason: "Numbness and tingling in my right hand, mostly at night (demo)",
      concerns: {
        when: "About three months ago (demo)",
        worse: "Typing for long stretches and holding my phone (demo)",
        tried: "Taking short breaks at work (demo)",
      },
      timeline: [
        { id: "demo-t1", month: monthsAgo(3), label: "Started waking up with tingly fingers (demo)" },
        { id: "demo-t2", month: monthsAgo(1), label: "Noticed it while typing at work too (demo)" },
      ],
    },
    questions: [
      { id: "demo-q1", text: "What will recovery look like for me?", priority: true, source: "Question builder", createdAt: now },
      { id: "demo-q2", text: "Do I need any tests related to Carpal Tunnel Syndrome?", priority: false, source: "Carpal Tunnel Syndrome", createdAt: now },
      { id: "demo-q3", text: "Can I keep working and doing my usual hobbies?", priority: false, source: "Question builder", createdAt: now },
    ],
  };
}
