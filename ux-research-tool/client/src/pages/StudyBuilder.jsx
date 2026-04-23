import { useParams } from 'react-router-dom';

export default function StudyBuilder() {
  const { id } = useParams();
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', color: '#6b7280', fontSize: 14 }}>
      <p>Study builder — coming soon (study id: {id})</p>
    </div>
  );
}
