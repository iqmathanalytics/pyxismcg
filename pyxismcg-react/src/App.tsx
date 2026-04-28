import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Profile = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

type AdminProfileInput = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

const serviceCards = [
  { title: "Program and Project Management", image: "index-service-image1.png", href: "program-and-project-management.htm" },
  { title: "Organizational Change Management", image: "index-service-image2.png", href: "organizational-change-management.htm" },
  { title: "Instructional Design & Training", image: "index-service-image3.png", href: "instructional-design-and-training.htm" },
  { title: "System Modernization & System Migration", image: "index-service-image4.png", href: "system-modernization-system-migration.htm" },
  { title: "Quality Assurance", image: "index-service-image5.png", href: "quality-assurance.htm" },
  { title: "Independent Verification & Validation", image: "index-service-image6.png", href: "independent-verification-and-validation.htm" },
  { title: "Procurement Services", image: "index-service-image7.png", href: "procurement-services.htm" },
];

const navItems = [
  { label: "OUR SERVICES", href: "program-and-project-management.htm" },
  { label: "INDUSTRIES", href: "health-and-human-services.htm" },
  { label: "ABOUT US", href: "about-us.htm#our-team" },
  { label: "CAREERS", href: "https://pyxis.keka.com/careers/" },
  { label: "CONTRACTS", href: "TX-DIR-ITSAC.htm" },
  { label: "CONNECT", href: "mailto:info@pyxismcg.com" },
];

const apartPoints = [
  {
    title: "Outcome-Led Delivery",
    text: "Execution frameworks tuned for measurable transformation outcomes, not just milestones.",
  },
  {
    title: "Deep Sector Expertise",
    text: "Cross-functional consultants with public and private sector modernization experience.",
  },
  {
    title: "Human-Centered Transformation",
    text: "Programs designed for adoption, resilience, and long-term operational value.",
  },
];

const footerServices = [
  { label: "Program and Project Management", href: "program-and-project-management.htm" },
  { label: "Organizational Change Management", href: "organizational-change-management.htm" },
  { label: "Instructional Design & Training", href: "instructional-design-and-training.htm" },
  { label: "System Modernization & System Migration", href: "system-modernization-system-migration.htm" },
  { label: "Quality Assurance", href: "quality-assurance.htm" },
  { label: "Independent Verification & Validation", href: "independent-verification-and-validation.htm" },
  { label: "Procurement Services", href: "procurement-services.htm" },
];

const footerMarkets = [
  { label: "Health and Human Services", href: "health-and-human-services.htm" },
  { label: "Transportation Services", href: "transporation-services.htm" },
  { label: "Healthcare", href: "healthcare.htm" },
  { label: "Life Sciences", href: "life-sciences.htm" },
];

const ADMIN_STORAGE_KEY = "pyxis_all_profiles";
const ADMIN_AUTH_KEY = "pyxis_admin_auth";
const ADMIN_ORDER_KEY = "pyxis_profile_order";
const LEGACY_CUSTOM_STORAGE_KEY = "pyxis_admin_profiles";

function getProfileKey(profile: Profile): string {
  return profile.id;
}

function parseProfiles(html: string): Profile[] {
  const pattern = /openProfile\(\s*'([\s\S]*?)',\s*'([\s\S]*?)',\s*'([\s\S]*?)',\s*'([\s\S]*?)'\s*\)/g;
  const profiles: Profile[] = [];
  let idx = 0;
  for (const match of html.matchAll(pattern)) {
    profiles.push({
      id: `seed-${idx++}`,
      name: match[1].replaceAll("\\'", "'"),
      role: match[2].replaceAll("\\'", "'"),
      bio: match[3].replaceAll("\\'", "'"),
      image: match[4].replace("images/", "/source/images/"),
    });
  }
  return profiles;
}

export default function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isAdminLogin = pathname === "/admin/login";
  const isAdminPanel = pathname === "/admin/panel";

  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileOrder, setProfileOrder] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [metricsInView, setMetricsInView] = useState(false);
  const [counts, setCounts] = useState({ years: 0, sectors: 0, initiatives: 0 });
  const [loginError, setLoginError] = useState("");
  const [adminForm, setAdminForm] = useState<AdminProfileInput>({
    name: "",
    role: "",
    bio: "",
    image: "",
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adminListPage, setAdminListPage] = useState(0);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/source/index.html")
      .then((r) => r.text())
      .then((html) => {
        const parsedProfiles = parseProfiles(html);
        const ensureIds = (items: Profile[]) =>
          items.map((item, index) => ({
            ...item,
            id: item.id ?? `migrated-${index}-${Date.now()}`,
          }));
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (stored) {
          try {
            const saved = JSON.parse(stored) as Profile[];
            if (Array.isArray(saved) && saved.length > 0) {
              const withIds = ensureIds(saved);
              setProfiles(withIds);
              localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(withIds));
              return;
            }
          } catch {
            // ignore parse error and fallback to parsed profiles
          }
        }

        const legacy = localStorage.getItem(LEGACY_CUSTOM_STORAGE_KEY);
        if (legacy) {
          try {
            const legacyProfiles = JSON.parse(legacy) as Profile[];
            if (Array.isArray(legacyProfiles) && legacyProfiles.length > 0) {
              const merged = ensureIds([...legacyProfiles, ...parsedProfiles]);
              setProfiles(merged);
              localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(merged));
              return;
            }
          } catch {
            // ignore legacy parse error and fallback
          }
        }

        setProfiles(parsedProfiles);
      })
      .catch(() => setProfiles([]));
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_ORDER_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as string[];
      setProfileOrder(Array.isArray(saved) ? saved : []);
    } catch {
      setProfileOrder([]);
    }
  }, []);

  useEffect(() => {
    const metrics = document.querySelector<HTMLElement>(".heroMetrics");
    if (!metrics) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMetricsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );
    observer.observe(metrics);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!metricsInView) return;
    const duration = 1300;
    const start = performance.now();
    const targets = { years: 30, sectors: 2, initiatives: 250 };
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts({
        years: Math.round(targets.years * eased),
        sectors: Math.round(targets.sectors * eased),
        initiatives: Math.round(targets.initiatives * eased),
      });
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [metricsInView]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoaded(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".revealOnScroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const orderedProfiles = useMemo(() => {
    if (profileOrder.length === 0) return profiles;
    const orderMap = new Map(profileOrder.map((key, index) => [key, index]));
    return [...profiles].sort((a, b) => {
      const aIndex = orderMap.get(getProfileKey(a));
      const bIndex = orderMap.get(getProfileKey(b));
      if (aIndex === undefined && bIndex === undefined) return 0;
      if (aIndex === undefined) return 1;
      if (bIndex === undefined) return -1;
      return aIndex - bIndex;
    });
  }, [profiles, profileOrder]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderedProfiles;
    return orderedProfiles.filter((profile) => `${profile.name} ${profile.role}`.toLowerCase().includes(q));
  }, [orderedProfiles, search]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const pagedProfiles = useMemo(
    () => filteredProfiles.slice(page * pageSize, page * pageSize + pageSize),
    [filteredProfiles, page]
  );
  const adminPageSize = 10;
  const adminTotalPages = Math.max(1, Math.ceil(orderedProfiles.length / adminPageSize));
  const pagedAdminProfiles = useMemo(
    () => orderedProfiles.slice(adminListPage * adminPageSize, adminListPage * adminPageSize + adminPageSize),
    [orderedProfiles, adminListPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  useEffect(() => {
    if (adminListPage > adminTotalPages - 1) setAdminListPage(adminTotalPages - 1);
  }, [adminListPage, adminTotalPages]);

  const heroStyle: CSSProperties = {
    transform: `translate3d(${heroTilt.x}px, ${heroTilt.y}px, 0)`,
  };
  const isEditing = editingKey !== null;

  const isAdminAuthenticated = localStorage.getItem(ADMIN_AUTH_KEY) === "true";

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    if (username === "admin" && password === "admin123") {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      window.location.href = "/admin/panel";
      return;
    }
    setLoginError("Invalid credentials. Use admin / admin123");
  };

  const saveProfiles = (nextProfiles: Profile[]) => {
    setProfiles(nextProfiles);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(nextProfiles));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAdminForm((prev) => ({ ...prev, image: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminForm.name || !adminForm.role || !adminForm.bio || !adminForm.image) return;
    const nextProfile: Profile = {
      id: editingKey ?? `custom-${Date.now()}`,
      name: adminForm.name.trim(),
      role: adminForm.role.trim(),
      bio: adminForm.bio.trim(),
      image: adminForm.image,
    };
    const nextProfiles = editingKey
      ? profiles.map((profile) => (getProfileKey(profile) === editingKey ? nextProfile : profile))
      : [nextProfile, ...profiles];
    saveProfiles(nextProfiles);
    setAdminForm({ name: "", role: "", bio: "", image: "" });
    setEditingKey(null);
  };

  const handleEditProfile = (profile: Profile, key: string) => {
    setAdminForm({
      name: profile.name,
      role: profile.role,
      bio: profile.bio,
      image: profile.image,
    });
    setEditingKey(key);
  };

  const handleDeleteProfile = (targetKey: string) => {
    const nextProfiles = profiles.filter((profile) => getProfileKey(profile) !== targetKey);
    saveProfiles(nextProfiles);
    const nextOrder = profileOrder.filter((key) => key !== targetKey);
    persistProfileOrder(nextOrder);
    if (editingKey === targetKey) {
      setEditingKey(null);
      setAdminForm({ name: "", role: "", bio: "", image: "" });
    }
  };

  const persistProfileOrder = (nextOrder: string[]) => {
    setProfileOrder(nextOrder);
    localStorage.setItem(ADMIN_ORDER_KEY, JSON.stringify(nextOrder));
  };

  const handleDropReorder = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    const currentKeys = orderedProfiles.map(getProfileKey);
    const fromIndex = currentKeys.indexOf(sourceKey);
    const toIndex = currentKeys.indexOf(targetKey);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...currentKeys];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persistProfileOrder(next);
  };

  if (isAdminLogin) {
    return (
      <div className="adminPage">
        <form className="adminCard" onSubmit={handleLogin}>
          <h1>Admin Login</h1>
          <p>Use this route path to access admin controls.</p>
          <input name="username" placeholder="Username" />
          <input name="password" type="password" placeholder="Password" />
          {loginError && <span className="adminError">{loginError}</span>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  if (isAdminPanel) {
    if (!isAdminAuthenticated) {
      window.location.href = "/admin/login";
      return null;
    }
    return (
      <div className="adminPage">
        <div className="adminCard wide">
          <div className="adminHeader">
            <h1>Admin Panel</h1>
            <div className="adminActions">
              <a href="/">Back to Home</a>
              <button
                onClick={() => {
                  localStorage.removeItem(ADMIN_AUTH_KEY);
                  window.location.href = "/admin/login";
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <form className="adminForm" onSubmit={handleCreateProfile}>
            <input
              placeholder="Full name"
              value={adminForm.name}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              placeholder="Role"
              value={adminForm.role}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, role: event.target.value }))}
            />
            <textarea
              placeholder="Bio"
              value={adminForm.bio}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, bio: event.target.value }))}
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {adminForm.image && <img src={adminForm.image} alt="Preview" className="adminPreview" />}
            <button type="submit">{isEditing ? "Update Profile" : "Add Profile"}</button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditingKey(null);
                  setAdminForm({ name: "", role: "", bio: "", image: "" });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
          <div className="adminList">
            <h2>Manage All Profiles</h2>
            {orderedProfiles.length === 0 && <p>No profiles found.</p>}
            {orderedProfiles.length > 0 && (
              <div className="teamPager adminPager">
                <button disabled={adminListPage === 0} onClick={() => setAdminListPage((p) => Math.max(0, p - 1))}>
                  Previous
                </button>
                <span>
                  Page {adminListPage + 1} of {adminTotalPages}
                </span>
                <button
                  disabled={adminListPage === adminTotalPages - 1}
                  onClick={() => setAdminListPage((p) => Math.min(adminTotalPages - 1, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
            {pagedAdminProfiles.map((profile) => {
              const key = getProfileKey(profile);
              return (
              <article key={key} className="adminListItem">
                <img src={profile.image} alt={profile.name} />
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.role}</span>
                </div>
                <div className="adminRowActions">
                  <button type="button" onClick={() => handleEditProfile(profile, key)}>Edit</button>
                  <button onClick={() => handleDeleteProfile(key)}>Delete</button>
                </div>
              </article>
            )})}
          </div>
          <div className="adminTeamPreview">
            <h2>Team Section Preview (Drag To Rearrange)</h2>
            <p>This order applies to the main Team section cards.</p>
            <div className="teamGrid">
              {orderedProfiles.map((profile) => {
                const key = getProfileKey(profile);
                return (
                  <article
                    key={key}
                    className={`profileCard adminDragCard ${dragKey === key ? "dragging" : ""} ${dropKey === key ? "dropTarget" : ""}`}
                    draggable
                    onDragStart={() => setDragKey(key)}
                    onDragEnd={() => {
                      setDragKey(null);
                      setDropKey(null);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropKey(key);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (dragKey) handleDropReorder(dragKey, key);
                      setDragKey(null);
                      setDropKey(null);
                    }}
                  >
                    <img src={profile.image} alt={profile.name} />
                    <div>
                      <strong>{profile.name}</strong>
                      <span>{profile.role}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isLoaded ? "loaded" : ""}`}>
      <header className="topNav">
        <img src="/source/images/logo.png" alt="Pyxis logo" className="logo" />
        <nav>
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="navLink" target={item.href?.startsWith("http") ? "_blank" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section
        className="hero revealOnScroll"
        onMouseMove={(event) => {
          const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - left) / width - 0.5) * 16;
          const y = ((event.clientY - top) / height - 0.5) * 12;
          setHeroTilt({ x, y });
        }}
        onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
      >
        <img src="/source/images/index-image1.png" alt="" className="heroBg" />
        <div className="heroOverlay" />
        <div className="heroGlowOrb" />
        <div className="heroGlowOrb heroGlowOrbSecondary" />
        <div className="heroLayout">
          <div className="heroContent" style={heroStyle}>
            <div className="heroBadge heroItem">Enterprise Transformation Partner</div>
            <h1 className="heroItem">Navigating success <span>together</span></h1>
            <p className="heroItem">
              We help public and private organizations modernize confidently with high-impact delivery, transparent execution, and outcome-focused consulting.
            </p>
            <div className="heroActions heroItem">
              <a href="mailto:info@pyxismcg.com">Connect With Us</a>
              <a href="/program-and-project-management.htm" className="ghostBtn">Explore Services</a>
            </div>
          </div>
          <div className="heroPanel heroItem">
            <img src="/source/svgs/location.svg" alt="" className="heroIcon" />
            <div className="heroPanelCard">
              <strong>30+ Years</strong>
              <span>Leadership in transformation</span>
            </div>
            <div className="heroPanelCard">
              <strong>Public + Private</strong>
              <span>Sector-specific consulting expertise</span>
            </div>
          </div>
        </div>
        <div className="heroMetrics revealOnScroll">
          <article>
            <h3>{counts.years}+</h3>
            <p>Years Experience</p>
          </article>
          <article>
            <h3>{counts.sectors}+</h3>
            <p>Core Sectors</p>
          </article>
          <article>
            <h3>{counts.initiatives}+</h3>
            <p>Modernization Initiatives</p>
          </article>
        </div>
        <div className="heroScrollCue">
          <span>Scroll</span>
          <i />
        </div>
      </section>
      <section className="section revealOnScroll">
        <h2>Our Services</h2>
        <div className="serviceGrid">
          {serviceCards.map((card, index) => (
            <a className="serviceCard revealOnScroll" style={{ ["--delay" as string]: `${index * 70}ms` }} key={card.title} href={`/${card.href}`}>
              <img src={`/source/images/${card.image}`} alt={card.title} />
              <div>
                <h3>{card.title}</h3>
                <span>Read more</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="splitBanner revealOnScroll">
        <img src="/source/images/index-image3.png" alt="" />
        <div className="apartOverlay">
          <div className="apartHeading">
            <img src="/source/svgs/stars.svg" alt="" />
            <div>
              <h2>What Sets Us Apart</h2>
              <p>
                PYXIS Management Consulting Group partners with agencies on modernization initiatives in both the public and private sectors.
              </p>
            </div>
          </div>
          <div className="apartGrid">
            {apartPoints.map((point, index) => (
              <article key={point.title} className="apartCard revealOnScroll" style={{ ["--delay" as string]: `${index * 90}ms` }}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="teamSection revealOnScroll">
        <div className="teamHeader">
          <img src="/source/svgs/team.svg" alt="" />
          <h2>Our Team</h2>
          <input
            placeholder="Search by name or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="teamPager">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button disabled={page === totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
            Next
          </button>
        </div>
        <div className="teamGrid">
          {pagedProfiles.map((profile) => (
            <button className="profileCard" key={profile.name} onClick={() => setActiveProfile(profile)}>
              <img src={profile.image} alt={profile.name} />
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.role}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="cta revealOnScroll">
        <img src="/source/images/index-image5.png" alt="" />
        <a href="mailto:info@pyxismcg.com">CONNECT WITH US</a>
      </section>

      <footer className="footer revealOnScroll">
        <div className="footerTop">
          <div className="footerBrand">
            <img src="/source/svgs/logo-white.svg" alt="Pyxis" />
            <p>
              Transforming vision into measurable business outcomes with modern consulting for public and private organizations.
            </p>
          </div>

          <div className="footerLinksBlock">
            <h4>Our Services</h4>
            <div className="footerLinksList">
              {footerServices.map((link) => (
                <a key={link.label} href={`/${link.href}`}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="footerLinksBlock">
            <h4>Markets</h4>
            <div className="footerLinksList">
              {footerMarkets.map((link) => (
                <a key={link.label} href={`/${link.href}`}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="footerLinksBlock">
            <h4>Contact</h4>
            <div className="footerLinksList">
              <a href="mailto:info@pyxismcg.com">info@pyxismcg.com</a>
            </div>
            <h4>Follow Us On</h4>
            <a
              href="https://www.linkedin.com/company/pyxis-management-consulting-group/mycompany/?viewAsMember=true"
              className="socialLink"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/source/images/linkedin.png" alt="LinkedIn" />
              LinkedIn
            </a>
          </div>
        </div>
        <p className="footerBottom">Copyright 2026 © PYXIS Management Consulting Group. All Rights Reserved.</p>
      </footer>

      {activeProfile && (
        <div className="modalBackdrop" onClick={() => setActiveProfile(null)}>
          <article className="modalCard" onClick={(event) => event.stopPropagation()}>
            <img src={activeProfile.image} alt={activeProfile.name} />
            <h3>{activeProfile.name}</h3>
            <h4>{activeProfile.role}</h4>
            <p>{activeProfile.bio}</p>
            <button onClick={() => setActiveProfile(null)}>Close</button>
          </article>
        </div>
      )}
    </div>
  );
}
