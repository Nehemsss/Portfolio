import { Text } from '@react-three/drei'
import { portfolio } from '../../../data/portfolio'
import { FONTS } from '../../fonts'
import { materials } from '../../materials'
import { Barn, Chicken, CropField, HayBales } from './Farm'
import Lighthouse from './Lighthouse'

/*
 * Home Island layout (local frame, unscaled; +Z faces the dock and the default camera):
 *
 *            sign (back)            lighthouse (back-left)
 *                  crop field (centre, landscape)
 *   bench (front-left)  |path|  barn + hay + chickens (front-right)
 *
 * Everything stays within ~7.3 units of the centre (the Home LANDMARK_CLEARANCE ÷ scale),
 * so the pine groves grow around it, and clear of the central stepping-stone path (|x| < 0.5).
 */
export default function HomeLandmark() {
  const { title, subtitle } = portfolio.welcomeSign
  return (
    <>
      <Lighthouse position={[-5, 0, -3]} />

      {/* Welcome sign at the back, facing the dock (+Z) so it reads from the default camera */}
      <group position={[1.5, 0, -4.2]}>
        {/* Posts sit behind the board (board back face is at z = -0.125; post depth 0.3) */}
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} material={materials.wood} position={[x, 1.3, -0.28]}>
            <boxGeometry args={[0.3, 2.6, 0.3]} />
          </mesh>
        ))}
        <mesh material={materials.signBoard} position-y={2.9}>
          <boxGeometry args={[6.2, 2.4, 0.25]} />
        </mesh>
        <Text
          font={FONTS.heading}
          position={[0, 3.35, 0.14]}
          fontSize={1.1}
          maxWidth={5.8}
          color="#fff6e0"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
        <Text
          font={FONTS.body}
          position={[0, 2.4, 0.14]}
          fontSize={0.38}
          maxWidth={5.2}
          lineHeight={1.2}
          textAlign="center"
          color="#fff6e0"
          anchorX="center"
          anchorY="middle"
        >
          {subtitle}
        </Text>
      </group>

      {/* Farm: big landscape crop field in the middle, barnyard front-right */}
      <CropField position={[0, 0, 0.6]} width={6.4} depth={3.2} />
      <Barn position={[3, 0, 4.6]} yaw={-0.2} />
      <HayBales position={[5.3, 0, 3]} yaw={0.5} />
      <Chicken position={[2, 0, 6.3]} yaw={0.6} />
      <Chicken position={[2.9, 0, 6.5]} yaw={-1.2} />
      <Chicken position={[3.7, 0, 6]} yaw={2.4} />

      {/* Bench (front-left) */}
      <group position={[-3.2, 0, 4.5]} rotation-y={0.3}>
        <mesh material={materials.wood} position-y={0.55}>
          <boxGeometry args={[2, 0.12, 0.6]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} material={materials.darkWood} position={[x, 0.27, 0]}>
            <boxGeometry args={[0.12, 0.55, 0.5]} />
          </mesh>
        ))}
      </group>
    </>
  )
}
