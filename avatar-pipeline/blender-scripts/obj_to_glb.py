"""
Blender script for converting OBJ to GLB with mesh optimization
"""
import bpy
import sys
import os
import mathutils

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

def center_object(obj):
    """Center the object at origin"""
    # Calculate bounding box center
    bbox_center = sum((mathutils.Vector(b) for b in obj.bound_box), mathutils.Vector()) / 8
    
    # Move object to center it
    obj.location = -bbox_center

def decimate_mesh(obj, ratio=0.25):
    """Apply decimation modifier to reduce polygon count"""
    if ratio >= 1.0:
        return  # No decimation needed
    
    # Add decimate modifier
    decimate_mod = obj.modifiers.new(name='Decimate', type='DECIMATE')
    decimate_mod.ratio = ratio
    decimate_mod.decimate_type = 'COLLAPSE'
    
    # Apply the modifier
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=decimate_mod.name)

def optimize_materials(obj):
    """Optimize materials for web delivery"""
    if not obj.data.materials:
        return
    
    for material in obj.data.materials:
        if material:
            # Ensure material has a principled BSDF
            if material.use_nodes:
                nodes = material.node_tree.nodes
                principled = None
                for node in nodes:
                    if node.type == 'BSDF_PRINCIPLED':
                        principled = node
                        break
                
                if principled:
                    # Set reasonable defaults for web
                    principled.inputs['Metallic'].default_value = 0.0
                    principled.inputs['Roughness'].default_value = 0.5
                    principled.inputs['Specular'].default_value = 0.5

def export_glb(filepath):
    """Export scene as GLB file"""
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_materials='EXPORT',
        export_colors=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_apply=True,
        export_animations=False,
        export_frame_range=False,
        export_frame_step=1,
        export_force_sampling=False,
        export_nla_strips=False,
        export_def_bones=False,
        export_current_frame=False,
        export_skins=False,
        export_all_influences=False,
        export_morph=False,
        export_morph_normal=False,
        export_morph_tangent=False,
        export_lights=False,
        export_displacement=False,
        export_original_specular=False,
        export_clearcoat=False,
        export_sheen=False,
        export_transmission=False,
        export_thickness=False,
        export_ior=False,
        export_volume=False,
        export_emissive_strength=False,
        export_extras=False,
        export_image_format='AUTO',
        export_texture_dir='',
        export_keep_originals=False,
        export_texcoords=True,
        export_normals=True,
        export_draco_mesh_compression_enable=False,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_draco_color_quantization=10,
        export_draco_generic_quantization=12,
        export_tangents=False,
        export_materials='EXPORT',
        export_original_specular=False,
        export_clearcoat=False,
        export_sheen=False,
        export_transmission=False,
        export_thickness=False,
        export_ior=False,
        export_volume=False,
        export_emissive_strength=False,
        export_extras=False,
        export_image_format='AUTO',
        export_texture_dir='',
        export_keep_originals=False,
        export_texcoords=True,
        export_normals=True,
        export_draco_mesh_compression_enable=False,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_draco_color_quantization=10,
        export_draco_generic_quantization=12,
        export_tangents=False
    )

def main():
    """Main conversion function"""
    # Parse command line arguments
    argv = sys.argv
    if "--" in argv:
        idx = argv.index("--")
        args = argv[idx+1:]
    else:
        args = []
    
    if len(args) < 2:
        print("Usage: blender --background --python obj_to_glb.py -- input.obj output.glb [decimate_ratio]")
        sys.exit(1)
    
    input_obj = args[0]
    output_glb = args[1]
    decimate_ratio = float(args[2]) if len(args) > 2 else 0.25
    
    print(f"Converting {input_obj} to {output_glb} with decimate ratio {decimate_ratio}")
    
    try:
        # Clear scene
        clear_scene()
        
        # Import OBJ
        obj = import_obj(input_obj)
        print(f"Imported object: {obj.name}")
        
        # Center object
        center_object(obj)
        
        # Decimate mesh if needed
        if decimate_ratio < 1.0:
            decimate_mesh(obj, decimate_ratio)
            print(f"Applied decimation with ratio {decimate_ratio}")
        
        # Optimize materials
        optimize_materials(obj)
        
        # Export GLB
        export_glb(output_glb)
        print(f"Exported GLB: {output_glb}")
        
        print("Conversion completed successfully")
        
    except Exception as e:
        print(f"Conversion failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
