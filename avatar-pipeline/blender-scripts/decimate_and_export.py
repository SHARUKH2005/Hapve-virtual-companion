"""
Advanced Blender script for mesh optimization and export
"""
import bpy
import sys
import os
import mathutils
import bmesh

def clear_scene():
    """Clear the default scene"""
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_obj(filepath):
    """Import OBJ file"""
    bpy.ops.import_scene.obj(filepath=filepath)
    
    # Get the imported object
    imported_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not imported_objects:
        raise RuntimeError("No mesh objects found in OBJ file")
    
    return imported_objects[0]

def center_and_scale_object(obj, target_size=1.0):
    """Center and scale object to target size"""
    # Calculate bounding box
    bbox_corners = [mathutils.Vector(corner) for corner in obj.bound_box]
    min_coords = mathutils.Vector((
        min(corner.x for corner in bbox_corners),
        min(corner.y for corner in bbox_corners),
        min(corner.z for corner in bbox_corners)
    ))
    max_coords = mathutils.Vector((
        max(corner.x for corner in bbox_corners),
        max(corner.y for corner in bbox_corners),
        max(corner.z for corner in bbox_corners)
    ))
    
    # Calculate center and size
    center = (min_coords + max_coords) / 2
    size = max_coords - min_coords
    max_dimension = max(size.x, size.y, size.z)
    
    # Move to center
    obj.location = -center
    
    # Scale to target size
    if max_dimension > 0:
        scale_factor = target_size / max_dimension
        obj.scale = (scale_factor, scale_factor, scale_factor)

def smart_decimate(obj, target_triangles=None, ratio=None):
    """Smart decimation that preserves important features"""
    if not target_triangles and not ratio:
        return
    
    # Enter edit mode
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Get current triangle count
    bm = bmesh.from_mesh(obj.data)
    current_triangles = len(bm.faces)
    
    if target_triangles and current_triangles <= target_triangles:
        bm.free()
        bpy.ops.object.mode_set(mode='OBJECT')
        return
    
    bm.free()
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Add decimate modifier
    decimate_mod = obj.modifiers.new(name='SmartDecimate', type='DECIMATE')
    
    if target_triangles:
        # Calculate ratio based on target triangle count
        decimate_mod.ratio = target_triangles / current_triangles
    else:
        decimate_mod.ratio = ratio
    
    decimate_mod.decimate_type = 'COLLAPSE'
    
    # Apply modifier
    bpy.ops.object.modifier_apply(modifier=decimate_mod.name)

def fix_normals(obj):
    """Fix normals for better lighting"""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    # Select all faces
    bpy.ops.mesh.select_all(action='SELECT')
    
    # Recalculate normals
    bpy.ops.mesh.normals_make_consistent(inside=False)
    
    bpy.ops.object.mode_set(mode='OBJECT')

def optimize_materials(obj):
    """Create optimized materials for web delivery"""
    if not obj.data.materials:
        # Create a default material
        mat = bpy.data.materials.new(name="DefaultMaterial")
        mat.use_nodes = True
        obj.data.materials.append(mat)
    
    for material in obj.data.materials:
        if material and material.use_nodes:
            nodes = material.node_tree.nodes
            principled = None
            
            # Find principled BSDF
            for node in nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    principled = node
                    break
            
            if principled:
                # Set web-friendly defaults
                principled.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1.0)
                principled.inputs['Metallic'].default_value = 0.0
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Specular'].default_value = 0.5
                principled.inputs['Emission'].default_value = (0.0, 0.0, 0.0, 1.0)
                principled.inputs['Alpha'].default_value = 1.0

def create_lods(obj, lod_levels=[0.5, 0.25, 0.1]):
    """Create multiple levels of detail"""
    lods = {}
    
    for i, ratio in enumerate(lod_levels):
        # Duplicate object
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.duplicate()
        lod_obj = bpy.context.active_object
        lod_obj.name = f"{obj.name}_LOD{i+1}"
        
        # Apply decimation
        smart_decimate(lod_obj, ratio=ratio)
        
        lods[f"lod_{i+1}"] = lod_obj
    
    return lods

def export_glb(filepath, export_settings=None):
    """Export scene as GLB with custom settings"""
    if export_settings is None:
        export_settings = {
            'export_format': 'GLB',
            'export_materials': 'EXPORT',
            'export_colors': True,
            'export_cameras': False,
            'export_lights': False,
            'export_yup': True,
            'export_apply': True,
            'export_animations': False,
            'export_frame_range': False,
            'export_frame_step': 1,
            'export_force_sampling': False,
            'export_nla_strips': False,
            'export_def_bones': False,
            'export_current_frame': False,
            'export_skins': False,
            'export_all_influences': False,
            'export_morph': False,
            'export_morph_normal': False,
            'export_morph_tangent': False,
            'export_lights': False,
            'export_displacement': False,
            'export_original_specular': False,
            'export_clearcoat': False,
            'export_sheen': False,
            'export_transmission': False,
            'export_thickness': False,
            'export_ior': False,
            'export_volume': False,
            'export_emissive_strength': False,
            'export_extras': False,
            'export_image_format': 'AUTO',
            'export_texture_dir': '',
            'export_keep_originals': False,
            'export_texcoords': True,
            'export_normals': True,
            'export_draco_mesh_compression_enable': False,
            'export_draco_mesh_compression_level': 6,
            'export_draco_position_quantization': 14,
            'export_draco_normal_quantization': 10,
            'export_draco_texcoord_quantization': 12,
            'export_draco_color_quantization': 10,
            'export_draco_generic_quantization': 12,
            'export_tangents': False
        }
    
    bpy.ops.export_scene.gltf(filepath=filepath, **export_settings)

def main():
    """Main optimization and export function"""
    # Parse command line arguments
    argv = sys.argv
    if "--" in argv:
        idx = argv.index("--")
        args = argv[idx+1:]
    else:
        args = []
    
    if len(args) < 2:
        print("Usage: blender --background --python decimate_and_export.py -- input.obj output.glb [target_triangles] [create_lods]")
        sys.exit(1)
    
    input_obj = args[0]
    output_glb = args[1]
    target_triangles = int(args[2]) if len(args) > 2 and args[2].isdigit() else None
    create_lods_flag = args[3].lower() == 'true' if len(args) > 3 else False
    
    print(f"Processing {input_obj} -> {output_glb}")
    print(f"Target triangles: {target_triangles}")
    print(f"Create LODs: {create_lods_flag}")
    
    try:
        # Clear scene
        clear_scene()
        
        # Import OBJ
        obj = import_obj(input_obj)
        print(f"Imported object: {obj.name}")
        
        # Center and scale
        center_and_scale_object(obj, target_size=1.0)
        print("Object centered and scaled")
        
        # Fix normals
        fix_normals(obj)
        print("Normals fixed")
        
        # Smart decimation
        if target_triangles:
            smart_decimate(obj, target_triangles=target_triangles)
            print(f"Applied smart decimation to {target_triangles} triangles")
        
        # Optimize materials
        optimize_materials(obj)
        print("Materials optimized")
        
        # Create LODs if requested
        if create_lods_flag:
            lods = create_lods(obj)
            print(f"Created {len(lods)} LOD levels")
        
        # Export main GLB
        export_glb(output_glb)
        print(f"Exported main GLB: {output_glb}")
        
        # Export LODs if created
        if create_lods_flag:
            base_path = os.path.splitext(output_glb)[0]
            for lod_name, lod_obj in lods.items():
                lod_path = f"{base_path}_{lod_name}.glb"
                export_glb(lod_path)
                print(f"Exported {lod_name}: {lod_path}")
        
        print("Processing completed successfully")
        
    except Exception as e:
        print(f"Processing failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
