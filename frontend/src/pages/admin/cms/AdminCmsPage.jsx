import React, { useState } from 'react';
import { FiFileText, FiEdit, FiCheck, FiGlobe, FiHelpCircle, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useGetCmsPagesQuery,
  useUpdateCmsPageMutation,
} from '../../../features/admin/adminApi';

const CMS_PAGES = [
  { slug: 'about-us', title: 'About Us', icon: FiGlobe, desc: 'Company mission, team background, and brand overview' },
  { slug: 'privacy-policy', title: 'Privacy Policy', icon: FiFileText, desc: 'Data collection policies, privacy rules, and security guidelines' },
  { slug: 'terms-and-conditions', title: 'Terms & Conditions', icon: FiFileText, desc: 'Platform usage rules, user rights, and seller obligations' },
  { slug: 'refund-policy', title: 'Refund & Cancellation Policy', icon: FiFileText, desc: 'Rules for order cancellations, wallet refunds, and return windows' },
  { slug: 'contact-us', title: 'Contact Us Information', icon: FiGlobe, desc: 'Support emails, phone numbers, office address, and business hours' },
  { slug: 'faq', title: 'Frequently Asked Questions (FAQ)', icon: FiHelpCircle, desc: 'Customer and vendor self-service FAQ articles' },
  { slug: 'blogs', title: 'Blogs & Articles', icon: FiBookOpen, desc: 'Platform blog posts, industry updates, and creator tips' },
  { slug: 'help-center', title: 'Help Center & Guides', icon: FiHelpCircle, desc: 'Platform user documentation, tutorials, and support articles' },
];

export default function AdminCmsPage() {
  const [activeSlug, setActiveSlug] = useState('about-us');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const { data: cmsData, isFetching } = useGetCmsPagesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [updateCms] = useUpdateCmsPageMutation();

  const handleOpenEdit = (page) => {
    setActiveSlug(page.slug);
    setEditTitle(page.title);
    const existing = cmsData?.items?.find((p) => p.slug === page.slug);
    setEditContent(existing?.content || `# ${page.title}\n\nWrite your markdown content here...`);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      await updateCms({ slug: activeSlug, title: editTitle, content: editContent, is_published: true }).unwrap();
      toast.success('CMS Page saved successfully!');
      setShowEditModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFileText}
        title="CMS Content Management"
        subtitle="Manage legal documents, static pages, FAQs, blogs, and Help Center documentation"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
        {CMS_PAGES.map((page) => {
          const Icon = page.icon;
          const existing = cmsData?.items?.find((p) => p.slug === page.slug);
          const isPublished = existing?.is_published !== false;

          return (
            <div key={page.slug} className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-xl">
                    <Icon className="w-5 h-5 text-[#d99a3d]" />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#1a1a1a]">{page.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">{page.desc}</p>
              </div>

              <button
                onClick={() => handleOpenEdit(page)}
                className="w-full py-2.5 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border-none"
              >
                <FiEdit className="w-3.5 h-3.5" /> Edit Page Content
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Content Modal */}
      <AdminModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Content — ${editTitle}`} maxWidth="max-w-3xl">
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Page Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Markdown / HTML Body</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-4 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-mono text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] h-72"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e3dccb]">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#1a1a1a] rounded-xl cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer border-none">
              <FiCheck className="w-4 h-4" /> Publish Page
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
