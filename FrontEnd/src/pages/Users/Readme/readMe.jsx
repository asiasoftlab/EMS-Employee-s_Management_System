import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, BookOpen, Clock, MapPin, Calendar, Home, 
  CheckCircle, Globe, Users, Code, Info, FileText 
} from 'lucide-react';
import './readMe.css';

export default function ReadMe() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('terms');

  // Simple scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => item.id);
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'features', label: 'Key Features', icon: CheckCircle },
    { id: 'hours', label: 'Working Hours', icon: Clock },
    { id: 'locations', label: 'Office Locations', icon: MapPin },
    { id: 'leaves', label: 'Leave Policy', icon: Calendar },
    { id: 'wfh', label: 'Work from Home', icon: Home },
    { id: 'guidelines', label: "Do's and Don'ts", icon: Info },
    { id: 'websites', label: 'Our Websites', icon: Globe },
    { id: 'teams', label: 'Our Teams', icon: Users },
    { id: 'development', label: 'Development Details', icon: Code },
  ];

  return (
    <div className="readme-container">
      
      {/* Sidebar Navigation */}
      <aside className="readme-sidebar">
        <button 
          onClick={() => navigate('/login')} 
          className="readme-back-btn"
        >
          <ChevronLeft size={16} /> Back to Login
        </button>
        
        <div>
          <h1 className="readme-sidebar-title">Company Policies</h1>
          <p className="readme-sidebar-subtitle">Please read before using the portal</p>
        </div>

        <nav className="readme-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`readme-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} /> {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="readme-main">
        
        <div className="readme-notice">
          <Info size={24} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <h4 className="readme-notice-title">Important Notice</h4>
            <p className="readme-notice-text">
              By accessing and using this Employee Management System, you agree to abide by all the policies and guidelines outlined in this document. Ignorance of these policies is not considered an acceptable excuse for non-compliance.
            </p>
          </div>
        </div>

        {/* Sections */}
        <section id="terms" className="readme-section">
          <h2 className="readme-section-title">Terms & Conditions</h2>
          <p className="readme-text">
            Welcome to the centralized Employee Management System (EMS). This platform is strictly for authorized personnel only. 
          </p>
          <ul className="readme-list">
            <li>1. Accessing the portal without authorization is strictly prohibited.</li>
            <li>2. Login is restricted to users with an @asiasoftlab.in email address only.</li>
            <li>3. You must keep your login credentials (username and password) confidential at all times.</li>
            <li>4. All data within this system is proprietary and confidential. Unauthorized sharing is grounds for immediate termination.</li>
            <li>5. The company reserves the right to monitor all activities performed within the EMS platform for security and audit purposes.</li>
          </ul>
        </section>

        <section id="features" className="readme-section">
          <h2 className="readme-section-title">Key Features of EMS</h2>
          <div className="readme-features-grid">
            {[
              { t: 'My Attendance', d: 'Real-time check-in and check-out tracking with overtime calculation.' },
              { t: 'My Task', d: 'Create, manage, and update your daily tasks assigned by managers.' },
              { t: 'Leave Request', d: 'Apply for leaves, track leave balances, and view approval status.' },
              { t: 'Notice Board', d: 'Stay updated with the latest company announcements and memos.'},
              { t: 'Profile', d: 'Manage your personal information and professional details.'},
            ].map((f, i) => (
              <div key={i} className="readme-feature-card">
                <h4 className="readme-feature-title">{f.t}</h4>
                <p className="readme-feature-desc">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="hours" className="readme-section">
          <h2 className="readme-section-title">Working Hours</h2>
          <p className="readme-text">
            Our standard operational hours are designed to promote a healthy work-life balance while ensuring maximal productivity.
          </p>
          <div className="readme-hours-card">
            <div className="readme-hours-row">
              <span className="readme-hours-label">Standard Shift</span>
              <span className="readme-hours-value">09:30 AM - 05:30 PM</span>
            </div>
            <div className="readme-hours-row">
              <span className="readme-hours-label">Required Core Hours</span>
              <span className="readme-hours-value">7 hours 30 minutes / Day</span>
            </div>
            <div className="readme-hours-row" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <span className="readme-hours-label">Lunch Break</span>
              <span className="readme-hours-value">1:00 PM - 1:30 PM (30 Minutes)</span>
            </div>
          </div>
        </section>

        <section id="locations" className="readme-section">
          <h2 className="readme-section-title">Office Locations</h2>
          <p className="readme-text">
            We operate out of several state-of-the-art facilities globally. Please ensure you select your correct primary operating base in your profile.
          </p>
          <ul className="readme-list">
            <li><strong>Headquarters :</strong> Asia Softlab Pvt Ltd, 10/572, MGU Innovation Foundation, University Campus Road, Mahatma Gandhi University, Athirampuzha, Kottayam.</li>
            <li><strong>Branch Office :</strong> Asia Softlab Pvt Ltd, Musaliar College of Engineering,Chirayinkeezhu, Thiruvananthapuram.</li>
            <li><strong>International Office:</strong> SG Academy Lot D-00-03A, Putra Majestik, Jalan Kasipillay, Off Jalan Ipoh, 51200 Kuala Lumpur, Malaysia.</li>
          </ul>
        </section>

        <section id="leaves" className="readme-section">
          <h2 className="readme-section-title">How to Apply Leave</h2>
          <p className="readme-text">
            Leave applications must be routed through the EMS portal for proper tracking and manager approval.
          </p>
          <ol className="readme-list">
            <li>Navigate to the <strong>Leaves</strong> tab in the sidebar.</li>
            <li>Click on the <strong>Apply Leave</strong> button.</li>
            <li>Select the Leave Type (Casual, Sick, or Earned).</li>
            <li>Provide a valid reason and select your date ranges.</li>
            <li>Submit. Your manager will be notified instantly.</li>
          </ol>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', fontStyle: 'italic', marginTop: '1rem' }}>* Note: Planned leaves must be applied at least 3 days in advance.</p>
        </section>

        <section id="wfh" className="readme-section">
          <h2 className="readme-section-title">Choosing Work From Home (WFH)</h2>
          <p className="readme-text">
            We support hybrid working models. Employees are eligible for up to 2 WFH days per week, subject to manager approval and project requirements.
          </p>
          <ul className="readme-list">
            <li>1. WFH requests must be applied via the Leave module by selecting the "WFH" leave type.</li>
            <li>2. You must remain available online on Teams during core working hours.</li>
            <li>3. Ensure you have a stable internet connection and a distraction-free environment.</li>
          </ul>
        </section>

        <section id="guidelines" className="readme-section">
          <h2 className="readme-section-title">Do's and Don'ts</h2>
          <div className="readme-dos-donts-grid">
            <div className="readme-dos-card">
              <h4 className="readme-dos-title"><CheckCircle size={18} /> DO'S</h4>
              <ul className="readme-dos-list">
                <li>1. Clock in promptly at the start of your shift.</li>
                <li>2. Update your task status daily before logging off.</li>
                <li>3. Report any system bugs or access issues to Software & Dev. Team immediately.</li>
                <li>4. Respect your colleagues' calendar availability.</li>
              </ul>
            </div>
            <div className="readme-donts-card">
              <h4 className="readme-donts-title"><Info size={18} /> DON'TS</h4>
              <ul className="readme-donts-list">
                <li>1. Do not attempt to clock in outside of the office network unless on approved WFH.</li>
                <li>2. Do not share screenshots of the dashboard externally.</li>
                <li>3. Do not use profanity or unprofessional language in the Chat or Notice board.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="websites" className="readme-section">
          <h2 className="readme-section-title">Our Running Websites</h2>
          <p className="readme-text">
            The EMS integrates and links with several of our external and internal portals.
          </p>
          <div className="readme-links-container">
            <a href="https://www.asiasoftlab.com" className="readme-link-card"><Globe size={16} /> Asia Softlab - Official Website</a>
            <a href="https://www.asiadronestore.com" className="readme-link-card"><Globe size={16} /> Asia Drone Store - Buy Drone</a>
            <a href="#" className="readme-link-card"><Globe size={16} /> Employees Management System(EMS)</a>
          </div>
        </section>

        <section id="teams" className="readme-section">
          <h2 className="readme-section-title">Our Teams</h2>
          <p className="readme-text">
            We operate in a cross-functional matrix. If you need assistance, please reach out to the respective department leads via the internal chat system.
          </p>
          <div className="readme-table-container">
            <table className="readme-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Head of Departmant</th>
                  <th>Official Mail</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Managing Director</strong></td>
                  <td>NISHADH</td>
                  <td>nishadh@asiasoftlab.in</td>
                  <td></td>
                </tr>
                <tr>
                  <td><strong>Research & Development</strong></td>
                  <td>VISHNU ROHITH</td>
                  <td>vishnurohith@asiasoftlab.in</td>
                  <td>9074566236</td>
                </tr>
                <tr>
                  <td><strong>Chief Instructor(RPTO)</strong></td>
                  <td>AKASH</td>
                  <td>akash@asiasoftlab.in</td>
                  <td>6383124036</td>
                </tr>
                <tr>
                  <td><strong>RPTO</strong></td>
                  <td>SUBIN</td>
                  <td>subin@asiasoftlab.in</td>
                  <td>6282448585</td>
                </tr>
                <tr>
                  <td><strong>Business Development</strong></td>
                  <td>HRISHIKESH</td>
                  <td>hrishikesh@asiasoftlab.in</td>
                  <td>7012147575</td>
                </tr>
                
                <tr>
                  <td><strong>Design (UI/UX)</strong></td>
                  <td>JOSEPH</td>
                  <td>joseph@asiasoftlab.in</td>
                  <td>7909175958</td>
                </tr>
                <tr>
                  <td><strong>Software & Development</strong></td>
                  <td>HARIKRISHNAN</td>
                  <td>harikrishnan@asiasoftlab.in</td>
                  <td>7907389098</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="development" className="readme-section">
          <h2 className="readme-section-title">Development Details</h2>
          <div className="readme-dev-card">
            <h4 className="readme-dev-title"><Code size={20} /> Tech Stack v2.1.0</h4>
            <p className="readme-dev-text"><strong>Frontend:</strong> React.js, Vite, Lucide Icons</p>
            <p className="readme-dev-text"><strong>Backend:</strong> Node.js, Express.js</p>
            <p className="readme-dev-text"><strong>Database:</strong> Firebase Firestore (NoSQL)</p>
            <p className="readme-dev-text" style={{ marginBottom: 0 }}><strong>Real-time:</strong> Socket.io WebSockets</p>
          </div>
        </section>

        <footer className="readme-footer">
          <h3 className="readme-footer-text">
             <Code size={16} color="#94a3b8" /> If any important Queries and suggestions, kindly contact the Software & Development Team.
          </h3>
        </footer>

      </main>
    </div>
  );
}
