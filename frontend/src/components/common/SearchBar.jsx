import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, FolderOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../ultis/api';
import './SearchBar.css';

export const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [show, setShow] = useState(false);
    const [results, setResults] = useState({ tasks: [], projects: [] });
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const debounceTimer = useRef(null);

    // Search function
    const performSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults({ tasks: [], projects: [] });
            return;
        }

        setLoading(true);
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                api.get('/tasks', { 
                    params: { 
                        pageNumber: 1, 
                        pageSize: 5 
                    } 
                }),
                api.get('/projects', { 
                    params: { 
                        pageNumber: 1, 
                        pageSize: 5,
                        searchTerm: searchQuery
                    } 
                })
            ]);

            // Filter tasks by project name or task ID
            const filteredTasks = (tasksRes?.data?.items || []).filter(task => 
                task.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.id.toString().includes(searchQuery)
            );

            setResults({
                tasks: filteredTasks.slice(0, 5),
                projects: projectsRes?.data?.items || []
            });
        } catch (error) {
            console.error('Search failed:', error);
            setResults({ tasks: [], projects: [] });
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (query.trim()) {
            debounceTimer.current = setTimeout(() => {
                performSearch(query);
            }, 300);
        } else {
            setResults({ tasks: [], projects: [] });
        }

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShow(false);
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show]);

    // Handle task click
    const handleTaskClick = (task) => {
        navigate(`/annotator/workspace?taskId=${task.id}`);
        setQuery('');
        setShow(false);
    };

    // Handle project click
    const handleProjectClick = (project) => {
        navigate(`/manager/projects/${project.id}`);
        setQuery('');
        setShow(false);
    };

    // Clear search
    const handleClear = () => {
        setQuery('');
        setResults({ tasks: [], projects: [] });
    };

    const hasResults = results.tasks.length > 0 || results.projects.length > 0;

    return (
        <div className="kiro-search-bar" ref={searchRef}>
            <div className="kiro-search-input-wrapper">
                <Search size={16} className="kiro-search-icon" />
                <input
                    type="text"
                    className="kiro-search-input"
                    placeholder="Search tasks, projects..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShow(true)}
                />
                {query && (
                    <button 
                        className="kiro-search-clear" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClear();
                        }}
                        type="button"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {show && query.trim() && (
                <div className="kiro-search-results">
                    {loading ? (
                        <div className="kiro-search-loading">
                            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted small mb-0">Searching...</p>
                        </div>
                    ) : hasResults ? (
                        <>
                            {/* Tasks Section */}
                            {results.tasks.length > 0 && (
                                <div className="kiro-search-section">
                                    <div className="kiro-search-section-title">Tasks</div>
                                    {results.tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="kiro-search-result-item"
                                            onClick={() => handleTaskClick(task)}
                                        >
                                            <div className="kiro-search-result-icon bg-primary bg-opacity-10">
                                                <Target size={16} className="text-primary" />
                                            </div>
                                            <div className="kiro-search-result-content">
                                                <div className="kiro-search-result-title">
                                                    Task #{task.id} - {task.projectName}
                                                </div>
                                                <div className="kiro-search-result-subtitle">
                                                    {task.completedItems}/{task.totalItems} items • {task.progressPercent.toFixed(0)}% complete
                                                </div>
                                            </div>
                                            <span className={`badge kiro-search-result-badge ${
                                                task.status === 'Completed' ? 'bg-success' :
                                                task.status === 'InProgress' ? 'bg-warning' :
                                                'bg-secondary'
                                            }`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Projects Section */}
                            {results.projects.length > 0 && (
                                <div className="kiro-search-section">
                                    <div className="kiro-search-section-title">Projects</div>
                                    {results.projects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="kiro-search-result-item"
                                            onClick={() => handleProjectClick(project)}
                                        >
                                            <div className="kiro-search-result-icon bg-success bg-opacity-10">
                                                <FolderOpen size={16} className="text-success" />
                                            </div>
                                            <div className="kiro-search-result-content">
                                                <div className="kiro-search-result-title">
                                                    {project.name}
                                                </div>
                                                <div className="kiro-search-result-subtitle">
                                                    {project.totalItems} items • {project.finishedItems} finished
                                                </div>
                                            </div>
                                            <span className={`badge kiro-search-result-badge ${
                                                project.status === 2 ? 'bg-success' :
                                                project.status === 1 ? 'bg-secondary' :
                                                'bg-info'
                                            }`}>
                                                {project.status === 2 ? 'Active' : 
                                                 project.status === 1 ? 'Draft' : 
                                                 project.status === 3 ? 'Completed' : 'Archived'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="kiro-search-empty">
                            <FileText size={32} className="kiro-search-empty-icon" />
                            <p className="kiro-search-empty-text mb-0">
                                No results found for "{query}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
