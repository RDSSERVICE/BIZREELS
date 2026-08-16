import React from 'react';

export default function ServiceAvailabilitySection({ form, updateForm }) {
  return (
    <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
      <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">
        4. Availability & Working Hours
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Working Hours</label>
          <input
            type="text"
            value={form.workingHours}
            onChange={(e) => updateForm('workingHours', e.target.value)}
            className="w-full p-2 bg-surface border rounded-xl text-xs text-text-primary"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.emergencyService24x7}
              onChange={(e) => updateForm('emergencyService24x7', e.target.checked)}
            />
            Emergency Service (24×7)
          </label>
        </div>

        <div className="col-span-2">
          <label className="text-[10px] font-bold text-text-tertiary block mb-1">Working Days</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const checked = form.workingDays.includes(day);
              return (
                <label
                  key={day}
                  className="flex items-center gap-1.5 text-xs cursor-pointer bg-surface border border-border px-2.5 py-1 rounded-xl text-text-primary"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const newDays = e.target.checked
                        ? [...form.workingDays, day]
                        : form.workingDays.filter((d) => d !== day);
                      updateForm('workingDays', newDays);
                    }}
                  />
                  {day}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
