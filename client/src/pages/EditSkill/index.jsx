/**
 * pages/EditSkill/index.jsx — Edit skill listing page.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SkillForm from '../../components/skills/SkillForm';
import { ROUTES } from '../../constants';
import { skillService } from '../../services/skill.service';

const EditSkill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    skillService
      .getById(id)
      .then(setSkill)
      .catch(apiError => setError(apiError.response?.data?.message || 'Unable to load skill listing.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async payload => {
    setIsSubmitting(true);
    setError('');
    try {
      const updatedSkill = await skillService.update(id, payload);
      navigate(`${ROUTES.MY_SKILLS}/${updatedSkill._id}`, {
        state: { notice: 'Skill listing updated successfully.' },
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update skill listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="surface-card p-8 text-sm font-medium text-steel-600">Loading skill listing...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={ROUTES.MY_SKILLS} className="text-sm font-semibold text-steel-600 hover:text-navy-900">Back to My Skills</Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Edit Skill</h1>
      </div>
      {skill ? (
        <SkillForm initialValues={skill} submitLabel="Save Changes" onSubmit={handleSubmit} isSubmitting={isSubmitting} apiError={error} />
      ) : (
        <div className="surface-card p-8 text-sm font-medium text-red-700">{error}</div>
      )}
    </div>
  );
};

export default EditSkill;
