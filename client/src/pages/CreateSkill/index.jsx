/**
 * pages/CreateSkill/index.jsx — Create skill listing page.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SkillForm from '../../components/skills/SkillForm';
import { ROUTES } from '../../constants';
import { skillService } from '../../services/skill.service';

const CreateSkill = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async payload => {
    setIsSubmitting(true);
    setError('');
    try {
      const skill = await skillService.create(payload);
      navigate(`${ROUTES.MY_SKILLS}/${skill._id}`, {
        state: { notice: 'Skill listing created successfully.' },
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to create skill listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to={ROUTES.MY_SKILLS} className="text-sm font-semibold text-steel-600 hover:text-navy-900">Back to My Skills</Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create Skill</h1>
      </div>
      <SkillForm submitLabel="Create Skill" onSubmit={handleSubmit} isSubmitting={isSubmitting} apiError={error} />
    </div>
  );
};

export default CreateSkill;
