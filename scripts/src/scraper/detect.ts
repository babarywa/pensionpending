const PENSION_RULES: Array<{
  match: (emp: string, prov: string, title: string) => boolean;
  plan: string;
}> = [
  {
    match: (e) =>
      e.includes("rcmp") || e.includes("royal canadian mounted police"),
    plan: "RCMP Pension Plan",
  },
  {
    match: (e) =>
      e.includes("canada border services") || e.includes("cbsa"),
    plan: "Public Service Pension Plan (Federal)",
  },
  {
    match: (e, _p, t) =>
      (e.includes("government of canada") ||
        e.includes("treasury board") ||
        e.includes("public service commission") ||
        e.includes("department of") ||
        e.includes("minister of") ||
        e.includes("federal")) &&
      !t.includes("municipal") &&
      !t.includes("provincial"),
    plan: "Public Service Pension Plan (Federal)",
  },
  {
    match: (_e, p, t) =>
      p === "ON" &&
      (t.includes("police") ||
        t.includes("constable") ||
        t.includes("detective") ||
        t.includes("inspector") ||
        t.includes("sergeant")),
    plan: "Ontario Police Pension Plan",
  },
  {
    match: (e, p) =>
      p === "ON" &&
      (e.includes("province of ontario") ||
        e.includes("government of ontario") ||
        e.includes("ontario public service") ||
        e.includes("ministry of") ||
        e.includes("ontario public") ||
        e.toLowerCase() === "ontario"),
    plan: "Ontario Public Service Pension Plan (OPSPP)",
  },
  {
    match: (_e, p) => p === "ON",
    plan: "OMERS (Ontario Municipal Employees Retirement System)",
  },
  {
    match: (e, p) =>
      p === "BC" &&
      (e.includes("province of british columbia") ||
        e.includes("government of bc") ||
        e.includes("bc public service") ||
        e.includes("bc government") ||
        e.includes("british columbia public service") ||
        e.toLowerCase() === "british columbia"),
    plan: "BC Public Service Pension Plan",
  },
  {
    match: (_e, p) => p === "BC",
    plan: "Municipal Pension Plan (BC)",
  },
  {
    match: (e, p) =>
      p === "AB" &&
      (e.includes("province of alberta") ||
        e.includes("government of alberta") ||
        e.includes("alberta public service") ||
        e.toLowerCase() === "alberta"),
    plan: "Public Service Pension Plan (Alberta)",
  },
  {
    match: (_e, p) => p === "AB",
    plan: "Local Authorities Pension Plan (LAPP)",
  },
  {
    match: (_e, p) => p === "QC",
    plan: "RREGOP (Régime de retraite des employés du gouvernement et des organismes publics)",
  },
  {
    match: (_e, p) => p === "MB",
    plan: "Civil Service Superannuation Fund (Manitoba)",
  },
  {
    match: (_e, p) => p === "SK",
    plan: "Public Employees Pension Plan (Saskatchewan)",
  },
  {
    match: (_e, p) => p === "NS",
    plan: "Public Service Superannuation Plan (Nova Scotia)",
  },
  {
    match: (_e, p) => p === "NB",
    plan: "Public Service Shared Risk Plan (New Brunswick)",
  },
  {
    match: (_e, p) => p === "PE",
    plan: "Civil Service Superannuation Fund (PEI)",
  },
  {
    match: (_e, p) => p === "NL",
    plan: "Public Service Pension Plan (Newfoundland & Labrador)",
  },
];

export function detectPensionPlan(
  employer: string,
  province: string,
  title: string
): string {
  const e = employer.toLowerCase();
  const p = province.toUpperCase().trim();
  const t = title.toLowerCase();

  for (const rule of PENSION_RULES) {
    if (rule.match(e, p, t)) return rule.plan;
  }
  return "Defined Benefit Pension (Plan Unconfirmed)";
}

const CATEGORY_PATTERNS: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["police", "constable", "detective", "sergeant", "inspector", "sheriff", "enforcement"], category: "Public Safety" },
  { keywords: ["fire", "firefighter", "paramedic", "ems", "emergency medical"], category: "Public Safety" },
  { keywords: ["nurse", "nursing", "physician", "doctor", "health", "medical", "clinical", "therapist", "pharmacist", "paramedic"], category: "Healthcare" },
  { keywords: ["software", "developer", "programmer", "full stack", "frontend", "backend", "devops", "cloud", "cybersecurity", "data scientist", "machine learning"], category: "Information Technology" },
  { keywords: ["it ", " it,", "information technology", "systems analyst", "network", "database administrator", "infrastructure", "helpdesk", "help desk", "technical support"], category: "Information Technology" },
  { keywords: ["engineer", "engineering", "civil", "mechanical", "electrical", "structural", "environmental engineer"], category: "Engineering" },
  { keywords: ["accountant", "accounting", "finance", "financial analyst", "budget", "payroll", "auditor", "treasury", "controller"], category: "Finance" },
  { keywords: ["human resources", "hr ", "recruitment", "talent", "labour relations", "compensation"], category: "Human Resources" },
  { keywords: ["legal", "lawyer", "counsel", "solicitor", "paralegal", "bylaw"], category: "Legal" },
  { keywords: ["planner", "planning", "urban", "land use", "zoning", "gis", "geographic"], category: "Planning & Development" },
  { keywords: ["communications", "marketing", "public relations", "media", "content", "social media", "graphic design"], category: "Communications" },
  { keywords: ["transit", "bus driver", "operator", "transportation", "traffic"], category: "Transit & Transportation" },
  { keywords: ["parks", "recreation", "arena", "aquatic", "facilities", "horticulture", "grounds"], category: "Parks & Recreation" },
  { keywords: ["library", "librarian", "archives"], category: "Library Services" },
  { keywords: ["social worker", "social services", "child welfare", "community services", "housing"], category: "Social Services" },
  { keywords: ["manager", "director", "executive", "superintendent", "chief administrative", "cao", "commissioner", "vp ", "vice president"], category: "Management" },
  { keywords: ["administrative", "clerk", "assistant", "receptionist", "secretary", "coordinator"], category: "Administration" },
  { keywords: ["by-law", "bylaw", "licensing", "permit", "inspection", "inspector"], category: "Regulatory & Compliance" },
  { keywords: ["educator", "instructor", "teacher", "trainer", "early childhood"], category: "Education & Training" },
  { keywords: ["procurement", "purchasing", "supply chain", "contracts"], category: "Procurement" },
];

export function detectCategory(title: string): string {
  const t = title.toLowerCase();
  for (const p of CATEGORY_PATTERNS) {
    if (p.keywords.some((kw) => t.includes(kw))) return p.category;
  }
  return "General";
}

export function parseSalary(text: string): {
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
} {
  if (!text || !text.trim()) return {};
  const clean = text.trim();

  const rangeMatch = clean.match(/\$?([\d,]+(?:\.\d+)?)\s*[-–to]+\s*\$?([\d,]+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(/,/g, ""));
    const max = parseFloat(rangeMatch[2].replace(/,/g, ""));
    if (min > 0 && max >= min) {
      const isHourly = /hour|hr\b/i.test(clean);
      return {
        salaryMin: isHourly ? undefined : Math.round(min),
        salaryMax: isHourly ? undefined : Math.round(max),
        salaryText: clean,
      };
    }
  }

  const singleMatch = clean.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1].replace(/,/g, ""));
    if (val > 1000) {
      return { salaryMin: Math.round(val), salaryText: clean };
    }
  }

  return { salaryText: clean };
}
