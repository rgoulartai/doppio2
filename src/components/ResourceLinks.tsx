import content from '../data/content.json';

export function ResourceLinks() {
  const { resources } = content;

  return (
    <div className="w-full max-w-sm mx-auto mt-8 px-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Keep Learning
      </h2>
      <div className="flex flex-col">
        {resources.map((resource) => (
          <a
            key={resource.url}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-4 border-b border-gray-100 last:border-0
              text-gray-700 hover:text-blue-600 active:opacity-70 transition-colors"
            style={{ touchAction: 'manipulation', minHeight: '44px' }}
          >
            <span className="text-2xl flex-shrink-0">{resource.emoji}</span>
            <div className="flex flex-col">
              <span className="font-medium text-sm text-gray-900">{resource.title}</span>
              <span className="text-xs text-gray-400 mt-0.5">{resource.description}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
