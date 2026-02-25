import { useState, useEffect, useRef } from 'react';
import {
    ArrowRight,
    Users,
    Target,
    Award,
    Clock,
    DollarSign,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    CheckCircle,
    Star,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import './HomePage.css';

export const HomePage = ({ onNavigateToLogin }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [underlineStyle, setUnderlineStyle] = useState({});
    const navMenuRef = useRef(null);

    // Add homepage-active class to body on mount
    useEffect(() => {
        document.body.classList.add('homepage-active');
        return () => {
            document.body.classList.remove('homepage-active');
        };
    }, []);

    // Update underline position
    useEffect(() => {
        const updateUnderline = () => {
            if (navMenuRef.current) {
                const activeLink = navMenuRef.current.querySelector('.active');
                if (activeLink) {
                    const navMenu = navMenuRef.current;
                    const offsetLeft = activeLink.offsetLeft;
                    const width = activeLink.offsetWidth;
                    setUnderlineStyle({
                        left: `${offsetLeft}px`,
                        width: `${width}px`,
                    });
                }
            }
        };
        updateUnderline();
        window.addEventListener('resize', updateUnderline);
        return () => window.removeEventListener('resize', updateUnderline);
    }, [activeSection]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            // Update active section based on scroll position
            const sections = ['home', 'about', 'positions', 'contact'];
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top <= 100 && rect.bottom >= 100;
                }
                return false;
            });
            if (current) setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            setActiveSection(sectionId);
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="homepage">
            {/* Navigation */}
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <button className="btn btn-primary login-btn-fixed" onClick={onNavigateToLogin}>
                    Join Now
                    <ArrowRight size={18} />
                </button>

                <div className="container">
                    <div className="navbar-content">
                        <div className="navbar-brand">
                            <div className="brand-logo">
                                <span className="logo-letter">DLS</span>
                            </div>
                            <span className="brand-name">LabelNexus</span>
                        </div>

                        {/* Desktop Menu */}
                        <ul className="nav-menu desktop-menu" ref={navMenuRef}>
                            <li>
                                <a
                                    href="#home"
                                    className={activeSection === 'home' ? 'active' : ''}
                                    onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                                >
                                    Home
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#about"
                                    className={activeSection === 'about' ? 'active' : ''}
                                    onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                                >
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#positions"
                                    className={activeSection === 'positions' ? 'active' : ''}
                                    onClick={(e) => { e.preventDefault(); scrollToSection('positions'); }}
                                >
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#contact"
                                    className={activeSection === 'contact' ? 'active' : ''}
                                    onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                >
                                    Contact
                                </a>
                            </li>
                            <span className="nav-underline" style={underlineStyle}></span>
                        </ul>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <ul className="nav-menu mobile-menu">
                            <li>
                                <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#positions" onClick={(e) => { e.preventDefault(); scrollToSection('positions'); }}>
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>
                                    Contact
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="hero-section">
                <div className="hero-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="grid-overlay"></div>
                </div>

                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Star size={16} className="me-2" />
                            We're Hiring - Join Our Team
                        </div>

                        <h1 className="hero-title">
                            Shape the Future of
                            <span className="gradient-text"> AI Data Labeling</span>
                        </h1>

                        <p className="hero-description">
                            Join LabelNexus as an Annotator or Reviewer and be part of creating
                            high-quality training data for next-generation AI systems.
                        </p>

                        <div className="hero-buttons">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => scrollToSection('positions')}
                            >
                                View Open Positions
                                <ArrowRight size={20} />
                            </button>
                            <button
                                className="btn btn-outline btn-lg"
                                onClick={() => scrollToSection('about')}
                            >
                                Learn More
                            </button>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Team Members</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">50K+</div>
                                <div className="stat-label">Projects Completed</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">98%</div>
                                <div className="stat-label">Quality Rate</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="scroll-indicator" onClick={() => scrollToSection('about')}>
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">About LabelNexus</span>
                        <h2 className="section-title">Who We Are</h2>
                        <p className="section-description">
                            We're a leading data annotation company powering AI innovation globally
                        </p>
                    </div>

                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="about-card">
                                <div className="about-icon">
                                    <Target size={32} />
                                </div>
                                <h3 className="about-card-title">Our Mission</h3>
                                <p className="about-card-text">
                                    To provide enterprise-grade data labeling services that accelerate
                                    AI development while maintaining the highest quality standards and
                                    creating meaningful employment opportunities.
                                </p>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="about-card">
                                <div className="about-icon">
                                    <Award size={32} />
                                </div>
                                <h3 className="about-card-title">Our Vision</h3>
                                <p className="about-card-text">
                                    To be the global leader in AI data annotation, setting industry
                                    benchmarks for quality, innovation, and team empowerment through
                                    cutting-edge tools and practices.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="values-section mt-5">
                        <h3 className="values-title">Why Join Us?</h3>
                        <div className="row g-4">
                            <div className="col-md-4">
                                <div className="value-card">
                                    <div className="value-icon">
                                        <DollarSign size={28} />
                                    </div>
                                    <h4>Competitive Pay</h4>
                                    <p>Industry-leading compensation with performance bonuses</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="value-card">
                                    <div className="value-icon">
                                        <Clock size={28} />
                                    </div>
                                    <h4>Flexible Hours</h4>
                                    <p>Work remotely with flexible scheduling options</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="value-card">
                                    <div className="value-icon">
                                        <Users size={28} />
                                    </div>
                                    <h4>Growth Opportunities</h4>
                                    <p>Clear career progression and skill development</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Positions Section */}
            <section id="positions" className="positions-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Open Positions</span>
                        <h2 className="section-title">Join Our Team</h2>
                        <p className="section-description">
                            We're actively hiring talented individuals for the following roles
                        </p>
                    </div>

                    <div className="row g-4">
                        {/* Annotator Position */}
                        <div className="col-lg-6">
                            <div className="position-card">
                                <div className="position-header">
                                    <div className="position-icon">
                                        <Briefcase size={32} />
                                    </div>
                                    <div>
                                        <h3 className="position-title">Data Annotator</h3>
                                        <div className="position-meta">
                                            <span className="position-type">Full-time / Part-time</span>
                                            <span className="position-location">
                                                <MapPin size={16} />
                                                Remote
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="position-description">
                                    Label images, text, and video data with precision using our advanced
                                    annotation tools. Perfect for detail-oriented individuals.
                                </p>

                                <div className="position-requirements">
                                    <h4>What We're Looking For:</h4>
                                    <ul>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Strong attention to detail and accuracy</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Basic computer skills and internet access</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Ability to follow guidelines precisely</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Commitment to quality and deadlines</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>No prior experience required - we provide training</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="position-benefits">
                                    <div className="benefit-item">
                                        <DollarSign size={20} />
                                        <div>
                                            <strong>Salary Range</strong>
                                            <p>$15-25/hour based on quality</p>
                                        </div>
                                    </div>
                                    <div className="benefit-item">
                                        <Clock size={20} />
                                        <div>
                                            <strong>Working Hours</strong>
                                            <p>Flexible schedule, min. 20hrs/week</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary w-100"
                                    onClick={onNavigateToLogin}
                                >
                                    Apply for Annotator
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Reviewer Position */}
                        <div className="col-lg-6">
                            <div className="position-card featured">
                                <div className="featured-badge">Popular</div>
                                <div className="position-header">
                                    <div className="position-icon">
                                        <Award size={32} />
                                    </div>
                                    <div>
                                        <h3 className="position-title">Quality Reviewer</h3>
                                        <div className="position-meta">
                                            <span className="position-type">Full-time</span>
                                            <span className="position-location">
                                                <MapPin size={16} />
                                                Remote
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="position-description">
                                    Review and validate annotated data to ensure highest quality standards.
                                    Ideal for experienced annotators seeking advancement.
                                </p>

                                <div className="position-requirements">
                                    <h4>What We're Looking For:</h4>
                                    <ul>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>6+ months annotation experience preferred</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Exceptional eye for detail and quality</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Strong analytical and decision-making skills</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Good communication for providing feedback</span>
                                        </li>
                                        <li>
                                            <CheckCircle size={18} />
                                            <span>Leadership potential and team collaboration</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="position-benefits">
                                    <div className="benefit-item">
                                        <DollarSign size={20} />
                                        <div>
                                            <strong>Salary Range</strong>
                                            <p>$25-40/hour + bonuses</p>
                                        </div>
                                    </div>
                                    <div className="benefit-item">
                                        <Clock size={20} />
                                        <div>
                                            <strong>Working Hours</strong>
                                            <p>40 hours/week, flexible schedule</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary w-100"
                                    onClick={onNavigateToLogin}
                                >
                                    Apply for Reviewer
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="container">
                    <div className="row g-5 align-items-center">
                        <div className="col-lg-6">
                            <div className="section-header text-start">
                                <span className="section-badge">Get In Touch</span>
                                <h2 className="section-title">Contact Us</h2>
                                <p className="section-description">
                                    Have questions? We'd love to hear from you. Send us a message
                                    and we'll respond as soon as possible.
                                </p>
                            </div>

                            <div className="contact-info">
                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4>Email</h4>
                                        <a href="mailto:careers@labelnexus.ai">careers@labelnexus.ai</a>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h4>Phone</h4>
                                        <a href="tel:+84123456789">+84 123 456 789</a>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="contact-icon">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4>Office</h4>
                                        <p>Thủ Đức, Thành phố Hồ Chí Minh, Vietnam</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="contact-form-wrapper">
                                <form className="contact-form">
                                    <div className="mb-3">
                                        <label className="form-label">Your Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Nguyễn Văn A"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="+84 123 456 789"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Message</label>
                                        <textarea
                                            className="form-control"
                                            rows="4"
                                            placeholder="Tell us about your interest..."
                                            required
                                        ></textarea>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100">
                                        Send Message
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="brand-logo">
                                <span className="logo-letter">L</span>
                            </div>
                            <span className="brand-name">LabelNexus</span>
                        </div>
                        <p className="footer-text">
                            Enterprise-grade data labeling and annotation management system.
                        </p>
                        <p className="footer-copyright">
                            © 2026 LabelNexus Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
