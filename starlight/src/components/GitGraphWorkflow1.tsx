import GitGraphWrapper from './GitGraphWrapper'

export default function GitGraphWorkflow1() {
    return (
        <GitGraphWrapper>
            {(gitgraph) => {
                const stable = gitgraph.branch({
                    name: 'stable',
                })
                stable.commit('Initial Commit')

                const featureA = stable.branch('feature-a')
                featureA.commit('commit1')
                // featureA.commit('commit1')
                // featureA.commit('commit1')

                const featureB = stable.branch('feature-b')
                featureB.commit('commit1')

                stable.commit('commit1')
                // featureB.commit('commit1')

                // const release = stable.branch('release-1.1.0')

                // release.merge(featureA)
                // release.merge(featureB)

                // stable.merge(release)
                // stable.tag('v1.1.0')
            }}
        </GitGraphWrapper>
    )
}
