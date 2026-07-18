import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import { FiCheckCircle, FiStar, FiHeart, FiTag } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const CreatorCategoriesTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [selectedCategories, setSelectedCategories] = useState(
    user?.creatorProfile?.skills || ['Fashion', 'Electronics', 'Restaurant']
  );

  const availableCategories = [
    { name: 'Fashion', desc: 'Apparel lookbooks & style reels', icon: '👗' },
    { name: 'Electronics', desc: 'Gadgets unboxing & product reviews', icon: '📱' },
    { name: 'Jewellery', desc: 'Premium ornaments styling & showcases', icon: '💎' },
    { name: 'Furniture', desc: 'Home decor design walkthroughs', icon: '🪑' },
    { name: 'Restaurant', desc: 'Food tasting tours & chef blogs', icon: '🍔' },
    { name: 'Hotel', desc: 'Staycation resort room guides', icon: '🏨' },
    { name: 'Education', desc: 'Online study hacks & guides tips', icon: '📚' },
    { name: 'Property', desc: 'Real estate apartment house tours', icon: '🏢' },
    { name: 'Automobile', desc: 'Car test drives & bike walkarounds', icon: '🚗' },
    { name: 'Agriculture', desc: 'Farming equipments & organic products', icon: '🌾' }
  ];

  const handleToggleCategory = (catName) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const handleSaveCategories = async () => {
    try {
      const res = await updateProfileApi({
        creatorProfile: {
          skills: selectedCategories
        }
      }).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success(`Niche focus categories updated successfully!`);
    } catch (e) {
      toast.error('Failed to update focus categories.');
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Dynamic Category Preferences</h3>
        <p className="text-xs text-slate-500 mt-1">Select focus niches. Vendors can filter you in the marketplace based on these tags.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {availableCategories.map((cat) => {
          const isSelected = selectedCategories.includes(cat.name);
          return (
            <div
              key={cat.name}
              onClick={() => handleToggleCategory(cat.name)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-start gap-3 cursor-pointer select-none
                ${isSelected
                  ? 'border-brand-purple bg-brand-purple/5 shadow-md scale-[1.02]'
                  : 'border-slate-100 bg-white hover:border-slate-200'
                }
              `}
            >
              <span className="text-2xl mt-0.5">{cat.icon}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                  {cat.name}
                  {isSelected && <FiCheckCircle className="text-brand-purple w-3.5 h-3.5 fill-current text-white" />}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 leading-relaxed">{cat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
        <Button
          onClick={handleSaveCategories}
          variant="primary"
          className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
        >
          Update Content Niches
        </Button>
      </div>
    </div>
  );
};

export default CreatorCategoriesTab;
