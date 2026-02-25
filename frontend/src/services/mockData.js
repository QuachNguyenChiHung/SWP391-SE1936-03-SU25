import { DataItemStatus, ProjectStatus, UserRole } from '../types.js';

export const MOCK_USERS = [
  { id: '1', name: 'Alex Admin', email: 'alex@nexus.ai', role: UserRole.ADMIN, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', active: true },
  { id: '2', name: 'Morgan Manager', email: 'morgan@nexus.ai', role: UserRole.MANAGER, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan', active: true },
  { id: '3', name: 'Sam Annotator', email: 'sam@nexus.ai', role: UserRole.ANNOTATOR, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', active: true },
  { id: '4', name: 'Riley Reviewer', email: 'riley@nexus.ai', role: UserRole.REVIEWER, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley', active: true },
  { id: '5', name: 'Jordan Labeler', email: 'jordan@nexus.ai', role: UserRole.ANNOTATOR, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', active: true },
];

export const MOCK_PROJECTS = [
  {
    id: 'p1',
    managerId: '2', // Morgan Manager
    name: 'Urban Traffic Analysis 2024',
    description: 'Bounding box detection for autonomous vehicle training dataset emphasizing pedestrians and cyclists.',
    guidelines: '1. Draw tight boxes around all visible vehicles.\n2. Include side mirrors in the bounding box.\n3. Do not label vehicles that are more than 50% occluded.\n4. Pedestrians must be labeled individually, not as groups.',
    type: 'IMAGE_BOUNDING_BOX',
    priority: 'HIGH',
    totalItems: 5000,
    completedItems: 3240,
    reviewedItems: 2800,
    status: ProjectStatus.PENDING,
    createdDate: '2023-11-15',
    classes: [
      { id: 'c1', name: 'Car', color: '#3b82f6', hotkey: '1' },
      { id: 'c2', name: 'Pedestrian', color: '#ef4444', hotkey: '2' },
      { id: 'c3', name: 'Cyclist', color: '#eab308', hotkey: '3' },
      { id: 'c4', name: 'Traffic Sign', color: '#8b5cf6', hotkey: '4' },
    ]
  },
  {
    id: 'p2',
    managerId: '2', // Morgan Manager
    name: 'Satellite Crop Monitoring',
    description: 'Segmentation of agricultural fields for crop health analysis.',
    guidelines: '1. Segment field boundaries precisely.\n2. Exclude irrigation equipment from crop segments.\n3. Mark water bodies with the specific Water class.',
    type: 'IMAGE_SEGMENTATION',
    priority: 'MEDIUM',
    totalItems: 1200,
    completedItems: 150,
    reviewedItems: 50,
    status: ProjectStatus.NOT_STARTED,
    createdDate: '2024-01-10',
    classes: [
      { id: 'c5', name: 'Healthy', color: '#22c55e', hotkey: 'Q' },
      { id: 'c6', name: 'Stressed', color: '#f97316', hotkey: 'W' },
      { id: 'c7', name: 'Water', color: '#06b6d4', hotkey: 'E' },
    ]
  },
  {
    id: 'p3',
    managerId: '2', // Morgan Manager
    name: 'Retail Shelf Audit',
    description: 'Identify out-of-stock items and planogram compliance.',
    guidelines: '1. Label every visible product face.\n2. Mark empty shelf spaces as "Empty Space".\n3. Ensure boxes do not overlap significantly.',
    type: 'IMAGE_BOUNDING_BOX',
    priority: 'LOW',
    totalItems: 8500,
    completedItems: 8500,
    reviewedItems: 8420,
    status: ProjectStatus.FINISHED,
    createdDate: '2023-09-01',
    classes: [
      { id: 'c8', name: 'Product', color: '#ec4899', hotkey: '1' },
      { id: 'c9', name: 'Empty Space', color: '#64748b', hotkey: '2' },
    ]
  }
];

// Using reliable Unsplash Source URLs with specific IDs to prevent broken links
export const MOCK_TASKS = [
  {
    id: 't1',
    projectId: 'p1',
    itemName: 'frame_00124.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.ACCEPTED,
    assignedTo: '3', // Sam Annotator
    dueDate: '2024-02-01',
    annotations: [
      { id: 'a1', labelId: 'c1', coordinates: { x: 100, y: 150, width: 200, height: 120 }, createdBy: 'HUMAN' },
    ]
  },
  {
    id: 't2',
    projectId: 'p1',
    itemName: 'frame_00125.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.IN_PROGRESS,
    assignedTo: '3', // Sam Annotator
    dueDate: '2024-02-02',
    annotations: []
  },
  {
    id: 't3',
    projectId: 'p1',
    itemName: 'frame_00126.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.NOT_ASSIGNED,
    assignedTo: undefined,
    annotations: []
  },
  {
    id: 't4',
    projectId: 'p1',
    itemName: 'frame_00127.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1592853625597-7d17be820d0c?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.COMPLETED,
    assignedTo: '5', // Jordan Labeler (Different annotator on same project)
    dueDate: '2024-01-30',
    annotations: [
      { id: 'a2', labelId: 'c2', coordinates: { x: 300, y: 200, width: 50, height: 100 }, createdBy: 'HUMAN' }
    ]
  },
  {
    id: 't5',
    projectId: 'p1',
    itemName: 'frame_00128.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.REJECTED,
    assignedTo: '3', // Sam Annotator
    annotations: [
      { id: 'a3', labelId: 'c1', coordinates: { x: 50, y: 50, width: 100, height: 80 }, createdBy: 'AI' }
    ]
  },
  // Task for Sam in a different project (p2)
  {
    id: 't6',
    projectId: 'p2',
    itemName: 'sat_crop_001.png',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.IN_PROGRESS,
    assignedTo: '3', // Sam Annotator (Same annotator, different project)
    dueDate: '2024-03-01',
    annotations: []
  },
  {
    id: 't7',
    projectId: 'p3',
    itemName: 'shelf_aisle_4.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80',
    status: DataItemStatus.COMPLETED,
    assignedTo: '5',
    annotations: []
  }
];

export const MOCK_ACTIVITY = [
  { id: 'l1', userId: '1', action: 'System Config', timestamp: '2024-01-20T10:30:00Z', details: 'Updated global retry policy' },
  { id: 'l2', userId: '2', action: 'Project Created', timestamp: '2024-01-19T14:15:00Z', details: 'Created project "Satellite Crop Monitoring"' },
  { id: 'l3', userId: '3', action: 'Task Completed', timestamp: '2024-01-19T09:45:00Z', details: 'Submitted 15 annotations for batch #233' },
  { id: 'l4', userId: '4', action: 'Review Rejection', timestamp: '2024-01-18T16:20:00Z', details: 'Rejected task t5 due to "Loose Bounding Box"' },
];