import React, { useState } from 'react';
import { FiX, FiCheck, FiInfo, FiDollarSign, FiPlus, FiTrash } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function HireCreatorModal({ creator, onClose, onSubmit, defaultValues = null }) {
  const isEditing = !!defaultValues;
  const name = creator?.name || 'Creator';

  const [title, setTitle] = useState(defaultValues?.title || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [productService, setProductService] = useState(defaultValues?.productService || '');
  const [category, setCategory] = useState(defaultValues?.category || 'Fashion & Lifestyle');
  
  // Deliverables Array
  const [deliverables, setDeliverables] = useState(defaultValues?.deliverables || ['1 HD Promotional Reel']);
  const [newDeliverable, setNewDeliverable] = useState('');

  const [numReels, setNumReels] = useState(defaultValues?.numReels || 1);
  const [numPosts, setNumPosts] = useState(defaultValues?.numPosts || 0);
  const [budget, setBudget] = useState(defaultValues?.budget || creator?.pricing?.reel1 || 0);
  const [deliveryDays, setDeliveryDays] = useState(defaultValues?.deliveryDays || 3);
  
  // Dates formatting helper
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayAfter = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateForInput = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(
    defaultValues?.startDate ? formatDateForInput(defaultValues.startDate) : getTodayDateString()
  );
  const [endDate, setEndDate] = useState(formatDateForInput(defaultValues?.endDate));
  const [deadline, setDeadline] = useState(formatDateForInput(defaultValues?.deadline));

  const [attachments, setAttachments] = useState(defaultValues?.attachments || []);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [specialInstructions, setSpecialInstructions] = useState(defaultValues?.specialInstructions || '');

  // Add Deliverable Tag
  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  // Remove Deliverable Tag
  const handleRemoveDeliverable = (idx) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  // Add Attachment URL
  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    if (!attachmentUrl.startsWith('http')) {
      toast.error('Please enter a valid HTTP URL for the attachment.');
      return;
    }
    setAttachments([...attachments, attachmentUrl.trim()]);
    setAttachmentUrl('');
  };

  // Remove Attachment URL
  const handleRemoveAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Campaign Title is required.');
      return;
    }
    if (!description.trim()) {
      toast.error('Campaign Description details are required.');
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      toast.error('Please proposed a valid budget cost.');
      return;
    }
    if (!deliveryDays || parseInt(deliveryDays, 10) <= 0) {
      toast.error('Proposed turnaround timeframe is required.');
      return;
    }

    if (startDate) {
      const today = getTodayDateString();
      if (startDate < today) {
        toast.error('Start date cannot be in the past.');
        return;
      }
    }
    if (startDate && endDate) {
      if (endDate <= startDate) {
        toast.error('End date must be after the start date.');
        return;
      }
    }
    if (startDate && deadline) {
      if (deadline <= startDate) {
        toast.error('Final deadline must be after the start date.');
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      productService: productService.trim(),
      category,
      deliverables,
      numReels: parseInt(numReels, 10) || 0,
      numPosts: parseInt(numPosts, 10) || 0,
      budget: parseFloat(budget),
      deliveryDays: parseInt(deliveryDays, 10),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      attachments,
      specialInstructions: specialInstructions.trim(),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary font-display">
              {isEditing ? 'Edit Campaign Proposal' : `Hire Creator: ${name}`}
            </h3>
            <p className="text-xs text-text-tertiary">
              {isEditing ? 'Modify your active proposal details.' : 'Submit a campaign request. Funds will be locked in escrow until completed.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Title & Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Campaign Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Clothes Reel Shoot"
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Product or Service Name</label>
              <input
                type="text"
                value={productService}
                onChange={(e) => setProductService(e.target.value)}
                placeholder="e.g. Brand Dress Collection"
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1">
            <label className="font-bold text-text-secondary">Campaign Details & Script Brief *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the creator needs to do. Provide storyline script, aesthetics rules, music styles, etc..."
              className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Row 3: Category & Deliverables array editor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Campaign Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Electronics & Tech">Electronics & Tech</option>
                <option value="Furniture & Interior">Furniture & Interior</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Beauty & Lifestyle">Beauty & Lifestyle</option>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Automotive">Automotive</option>
                <option value="Travel & Leisure">Travel & Leisure</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Add Deliverable Milestone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  placeholder="e.g. 1 Story post with Swipeup Link"
                  className="flex-1 px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-3 bg-surface border border-border text-text-primary rounded-xl hover:bg-surface-tertiary transition"
                >
                  <FiPlus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {deliverables.map((item, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full font-bold"
                  >
                    <span>{item}</span>
                    <FiTrash
                      size={10}
                      className="cursor-pointer text-red-500 hover:scale-110"
                      onClick={() => handleRemoveDeliverable(idx)}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Pricing metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Expected Reels</label>
              <input
                type="number"
                min={0}
                value={numReels}
                onChange={(e) => setNumReels(Math.max(0, parseInt(e.target.value, 10)))}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Expected Posts</label>
              <input
                type="number"
                min={0}
                value={numPosts}
                onChange={(e) => setNumPosts(Math.max(0, parseInt(e.target.value, 10)))}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Proposed Budget *</label>
              <div className="relative">
                <FiDollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="number"
                  min={1}
                  value={budget}
                  onChange={(e) => setBudget(Math.max(1, parseFloat(e.target.value)))}
                  className="w-full pl-7 pr-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple font-extrabold text-emerald-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Delivery (Days) *</label>
              <input
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(Math.max(1, parseInt(e.target.value, 10)))}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
                required
              />
            </div>
          </div>

          {/* Row 5: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Start Date</label>
              <input
                type="date"
                min={getTodayDateString()}
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (endDate && endDate <= newStart) {
                    setEndDate(getDayAfter(newStart));
                  }
                  if (deadline && deadline <= newStart) {
                    setDeadline(getDayAfter(newStart));
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">End Date</label>
              <input
                type="date"
                min={getDayAfter(startDate)}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-secondary">Final Deadline</label>
              <input
                type="date"
                min={getDayAfter(startDate)}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Row 6: Attachments url links builder */}
          <div className="space-y-1">
            <label className="font-bold text-text-secondary">Asset Attachments (Images, Storyboards, Logos)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="Paste HTTP URL to file assets..."
                className="flex-1 px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 bg-surface border border-border text-text-primary rounded-xl hover:bg-surface-tertiary transition"
              >
                Add Link
              </button>
            </div>
            <div className="space-y-1 mt-2">
              {attachments.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-surface-secondary border border-border p-2 rounded-xl text-[10px]">
                  <a href={item} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline truncate max-w-md">
                    {item}
                  </a>
                  <FiTrash
                    size={12}
                    className="cursor-pointer text-red-500 hover:scale-110 shrink-0"
                    onClick={() => handleRemoveAttachment(idx)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 7: Special Instructions */}
          <div className="space-y-1">
            <label className="font-bold text-text-secondary">Special Instructions</label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Do not include competing brand products in the shoot..."
              className="w-full px-3.5 py-2.5 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Actions footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 glass border border-border font-bold text-text-secondary rounded-xl hover:bg-surface-tertiary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 gradient-brand text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
            >
              <FiCheck size={16} /> {isEditing ? 'Save Changes' : 'Send Campaign Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
